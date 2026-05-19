import { create } from 'zustand'
import {
  signIn, signOut, signUp, getCurrentUser,
  fetchUserAttributes, fetchAuthSession,
} from 'aws-amplify/auth'
import axios from 'axios'

const syncWithBackend = async (token) => {
  const res = await axios.post(
    `${import.meta.env.VITE_API_URL}/api/auth/sync`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return res.data
}

const useAuthStore = create((set) => ({
  user: null,
  role: null,
  loading: true,

  init: async () => {
    try {
      const { userId }  = await getCurrentUser()
      const attributes  = await fetchUserAttributes()
      const session     = await fetchAuthSession()
      const token       = session.tokens?.idToken?.toString()
      const groups      = session.tokens?.idToken?.payload['cognito:groups'] || []
      const role        = groups[0] || 'customer'

      // sync to MongoDB on every session restore
      if (token) await syncWithBackend(token)

      set({ user: { userId, ...attributes }, role, loading: false })
    } catch {
      set({ user: null, role: null, loading: false })
    }
  },

  login: async (email, password) => {
    await signIn({ username: email, password })
    await useAuthStore.getState().init()
  },

  register: async (email, password, name, phone, referralCode) => {
    const normalized = phone.startsWith('+') ? phone
      : phone.startsWith('0') ? '+254' + phone.slice(1)
      : '+254' + phone

    const username = `user_${Date.now()}`

    await signUp({
      username,
      password,
      options: {
        userAttributes: { email, name, phone_number: normalized },
        clientMetadata: { referralCode: referralCode || '' },
      },
    })

    sessionStorage.setItem('pendingUsername', username)
  },

  logout: async () => {
    await signOut()
    set({ user: null, role: null })
  },
}))

export default useAuthStore

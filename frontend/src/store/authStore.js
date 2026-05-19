import { create } from 'zustand'
import {
  signIn, signOut, signUp, getCurrentUser,
  fetchUserAttributes, fetchAuthSession,
} from 'aws-amplify/auth'

const useAuthStore = create((set) => ({
  user: null,
  role: null,
  loading: true,

  // Call on app load to restore session
  init: async () => {
    try {
      const { userId } = await getCurrentUser()
      const attributes = await fetchUserAttributes()
      const session = await fetchAuthSession()
      const groups = session.tokens?.idToken?.payload['cognito:groups'] || []
      const role = groups[0] || 'customer'
      set({ user: { userId, ...attributes }, role, loading: false })
    } catch {
      set({ user: null, role: null, loading: false })
    }
  },

  login: async (email, password) => {
    await signIn({ username: email, password })
    await useAuthStore.getState().init()
  },

  register: async (email, password, name, phone) => {
    await signUp({
      username: email,
      password,
      options: { userAttributes: { email, name, phone_number: phone } },
    })
  },

  logout: async () => {
    await signOut()
    set({ user: null, role: null })
  },
}))

export default useAuthStore

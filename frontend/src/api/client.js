import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

const client = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

// attach JWT token if logged in, and guest session id always
client.interceptors.request.use(async (config) => {
  // guest session id for cart
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('sessionId', sessionId);
  }
  config.headers['x-session-id'] = sessionId;

  try {
    const session = await fetchAuthSession();
    const token   = session.tokens?.idToken?.toString();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // guest — no token
  }

  return config;
});

export default client;

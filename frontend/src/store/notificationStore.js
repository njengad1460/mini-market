import { create } from 'zustand';
import client from '../api/client.js';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const res = await client.get('/api/notifications');
      set({ notifications: res.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await client.patch(`/api/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        ),
      }));
    } catch (err) {
      console.error(err);
    }
  },

  markAllAsRead: async () => {
    try {
      await client.post('/api/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      }));
    } catch (err) {
      console.error(err);
    }
  },
  
  getUnreadCount: () => get().notifications.filter(n => !n.isRead).length
}));

export default useNotificationStore;

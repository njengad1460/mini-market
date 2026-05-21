import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useNotificationStore from '../store/notificationStore.js';
import useAuthStore from '../store/authStore.js';

export default function NotificationBell() {
  const { user } = useAuthStore();
  const { notifications, fetchNotifications, markAsRead, markAllAsRead, getUnreadCount } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Optional: poll every 60 seconds
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  if (!user) return null;

  const unreadCount = getUnreadCount();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 rounded-full hover:bg-gray-100 transition focus:outline-none"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black ring-opacity-5 z-40">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-lg">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="text-xs font-bold text-[var(--color-primary)] hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No notifications yet.</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => {
                      if (!n.isRead) markAsRead(n._id);
                      setIsOpen(false);
                    }}
                    className={`block rounded-xl p-3 transition ${n.isRead ? 'bg-white' : 'bg-[#f4fbf4]'} hover:bg-gray-50 cursor-pointer`}
                  >
                    <Link to={n.link || '#'} className="block">
                      <p className={`text-sm ${n.isRead ? 'font-medium' : 'font-extrabold text-[#111]'}`}>
                        {n.title}
                      </p>
                      <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="mt-2 text-[10px] font-semibold text-gray-400">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

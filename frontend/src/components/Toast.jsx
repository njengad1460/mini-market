import { create } from 'zustand';

// store
export const useToastStore = create((set, get) => ({
  toasts: [],
  show: (message, type = 'success') => {
    const id = Date.now();
    set({ toasts: [...get().toasts, { id, message, type }] });
    setTimeout(() => set({ toasts: get().toasts.filter(t => t.id !== id) }), 3000);
  },
}));

// component
export default function Toast() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${
            t.type === 'error' ? 'bg-red-500' :
            t.type === 'info'  ? 'bg-blue-500' : 'bg-green-600'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

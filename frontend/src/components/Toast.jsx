import useToastStore from '../store/toastStore.js';
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

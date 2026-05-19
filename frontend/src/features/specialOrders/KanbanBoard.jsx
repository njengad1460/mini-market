import { updateSpecialOrderStatus } from '../../api/specialOrders.js';
import { useToastStore } from '../../components/Toast.jsx';

const COLUMNS = [
  { key: 'pending',   label: '📥 Pending',   color: 'border-yellow-300 bg-yellow-50' },
  { key: 'reviewed',  label: '🔍 Reviewed',  color: 'border-blue-300 bg-blue-50' },
  { key: 'fulfilled', label: '✅ Fulfilled',  color: 'border-green-300 bg-green-50' },
  { key: 'rejected',  label: '❌ Rejected',   color: 'border-red-300 bg-red-50' },
];

export default function KanbanBoard({ orders, onUpdate }) {
  const toast = useToastStore((s) => s.show);

  const handleMove = async (orderId, newStatus) => {
    try {
      await updateSpecialOrderStatus(orderId, newStatus);
      toast(`Moved to ${newStatus} ✓`);
      onUpdate();
    } catch {
      toast('Failed to update', 'error');
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {COLUMNS.map((col) => {
        const colOrders = orders.filter(o => o.status === col.key);
        return (
          <div key={col.key} className={`border-2 rounded-xl p-3 ${col.color}`}>
            <p className="font-semibold text-sm mb-3">
              {col.label}
              <span className="ml-1 text-gray-500">({colOrders.length})</span>
            </p>

            <div className="space-y-2">
              {colOrders.map((order) => (
                <div key={order._id} className="bg-white border rounded-xl p-3 shadow-sm">
                  <p className="font-medium text-sm">{order.customer?.name}</p>
                  <p className="text-xs text-gray-500">{order.customer?.phone}</p>
                  <img
                    src={order.photoUrl}
                    alt="shoe"
                    className="w-full h-24 object-cover rounded-lg my-2"
                  />
                  {order.description && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{order.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mb-2">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>

                  {/* move buttons */}
                  <div className="flex flex-wrap gap-1">
                    {COLUMNS.filter(c => c.key !== col.key).map(c => (
                      <button
                        key={c.key}
                        onClick={() => handleMove(order._id, c.key)}
                        className="text-xs border rounded-lg px-2 py-1 hover:bg-gray-50"
                      >
                        → {c.key}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {colOrders.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">Empty</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

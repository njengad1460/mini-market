import { updateSpecialOrderStatus } from '../../api/specialOrders.js';
import useToastStore from '../../store/toastStore.js';
import { useState } from 'react';

const COLUMNS = [
  { key: 'pending',   label: '📥 Pending',   color: 'border-yellow-300 bg-yellow-50' },
  { key: 'awaiting_deposit',  label: '💰 Awaiting Deposit',  color: 'border-orange-300 bg-orange-50' },
  { key: 'ordered',  label: '🛒 Ordered',  color: 'border-blue-300 bg-blue-50' },
  { key: 'fulfilled', label: '🚚 Fulfilled',  color: 'border-purple-300 bg-purple-50' },
  { key: 'completed', label: '✅ Completed',  color: 'border-green-300 bg-green-50' },
  { key: 'rejected',  label: '❌ Rejected',   color: 'border-red-300 bg-red-50' },
];

export default function KanbanBoard({ orders, onUpdate }) {
  const toast = useToastStore((s) => s.show);
  const [quoteDrafts, setQuoteDrafts] = useState({});
  const [depositMethods, setDepositMethods] = useState({});
  const [finalPaymentMethods, setFinalPaymentMethods] = useState({});

  const handleMove = async (orderId, data) => {
    try {
      await updateSpecialOrderStatus(orderId, data);
      toast('Special order updated');
      onUpdate();
    } catch {
      toast('Failed to update', 'error');
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const colOrders = orders.filter(o => o.status === col.key);
        return (
          <div key={col.key} className={`flex-shrink-0 w-80 border-2 rounded-xl p-3 ${col.color}`}>
            <p className="font-semibold text-sm mb-3">
              {col.label}
              <span className="ml-1 text-gray-500">({colOrders.length})</span>
            </p>

            <div className="space-y-2">
              {colOrders.map((order) => (
                <div key={order._id} className="bg-white border rounded-xl p-3 shadow-sm">
                  <p className="font-medium text-sm">{order.customer?.name}</p>
                  <p className="text-xs text-gray-500">{order.customer?.phone}</p>
                  {order.photoUrl ? (
                    <img
                      src={order.photoUrl}
                      alt="shoe"
                      className="w-full h-24 object-cover rounded-lg my-2"
                    />
                  ) : (
                    <div className="my-2 rounded-lg bg-[#f7f6f2] px-3 py-4 text-xs text-[#666]">
                      <p className="font-semibold">{order.productName || order.product?.name}</p>
                      <p>Size: {order.requestedSize}</p>
                      {order.requestedColor && <p>Color: {order.requestedColor}</p>}
                    </div>
                  )}
                  {order.description && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{order.description}</p>
                  )}
                  {order.quotedAmount > 0 && (
                    <div className="mb-2 rounded-lg bg-[#f7f6f2] px-3 py-2 text-xs">
                      <p>Total: Ksh {order.quotedAmount.toLocaleString()}</p>
                      <p>Deposit needed: Ksh {order.requiredDeposit.toLocaleString()}</p>
                      <p>{order.depositPaid ? `Deposit paid (${order.depositPaymentMethod})` : 'Deposit not yet paid'}</p>
                      {order.finalPaymentPaid && (
                        <p>Final payment paid ({order.finalPaymentMethod})</p>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mb-2">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>

                  {!order.quotedAmount && (
                    <div className="mb-2 space-y-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Total shoe amount"
                        value={quoteDrafts[order._id] || ''}
                        onChange={(e) => setQuoteDrafts((current) => ({ ...current, [order._id]: e.target.value }))}
                        className="w-full rounded-lg border px-3 py-2 text-xs"
                      />
                      <button
                        onClick={() => handleMove(order._id, { quotedAmount: Number(quoteDrafts[order._id]) })}
                        className="w-full rounded-lg bg-[#265f2e] px-3 py-2 text-xs font-semibold text-[#fffdf8]"
                      >
                        Save Amount
                      </button>
                    </div>
                  )}

                  {order.quotedAmount > 0 && !order.depositPaid && (
                    <div className="mb-2 space-y-2">
                      <select
                        value={depositMethods[order._id] || 'cash'}
                        onChange={(e) => setDepositMethods((current) => ({ ...current, [order._id]: e.target.value }))}
                        className="w-full rounded-lg border px-3 py-2 text-xs"
                      >
                        <option value="cash">Cash deposit</option>
                        <option value="mpesa">M-Pesa deposit</option>
                      </select>
                      <button
                        onClick={() => handleMove(order._id, {
                          depositPaid: true,
                          depositPaymentMethod: depositMethods[order._id] || 'cash',
                        })}
                        className="w-full rounded-lg bg-[#a85d00] px-3 py-2 text-xs font-semibold text-[#fffdf8]"
                      >
                        Record 50% Deposit
                      </button>
                    </div>
                  )}

                  {order.status === 'fulfilled' && !order.finalPaymentPaid && (
                    <div className="mb-2 space-y-2">
                      <select
                        value={finalPaymentMethods[order._id] || 'cash'}
                        onChange={(e) => setFinalPaymentMethods((current) => ({ ...current, [order._id]: e.target.value }))}
                        className="w-full rounded-lg border px-3 py-2 text-xs"
                      >
                        <option value="cash">Cash final payment</option>
                        <option value="mpesa">M-Pesa final payment</option>
                      </select>
                      <button
                        onClick={() => handleMove(order._id, {
                          finalPaymentPaid: true,
                          finalPaymentMethod: finalPaymentMethods[order._id] || 'cash',
                        })}
                        className="w-full rounded-lg bg-[#265f2e] px-3 py-2 text-xs font-semibold text-[#fffdf8]"
                      >
                        Record Final Payment
                      </button>
                    </div>
                  )}

                  {/* move buttons */}
                  <div className="flex flex-wrap gap-1">
                    {COLUMNS.filter(c => c.key !== col.key).map(c => (
                      <button
                        key={c.key}
                        onClick={() => handleMove(order._id, { status: c.key })}
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

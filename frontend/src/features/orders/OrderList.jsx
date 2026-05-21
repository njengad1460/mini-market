import { useState } from 'react';
import { Link } from 'react-router-dom';

const statusColors = {
  pending:           'bg-yellow-100 text-yellow-700',
  partial_delivered: 'bg-blue-100 text-blue-700',
  delivered:         'bg-green-100 text-green-700',
  cancelled:         'bg-red-100 text-red-700',
};

const STATUSES = ['all', 'pending', 'partial_delivered', 'delivered', 'cancelled'];

export default function OrderList({ orders }) {
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = orders.filter((o) => {
    const matchStatus = status === 'all' || o.status === status;
    const matchSearch = !search ||
      o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.phone?.includes(search) ||
      o.guestPhone?.includes(search);
    return matchStatus && matchSearch;
  });

  return (
    <div>
      {/* search */}
      <input
        placeholder="Search by customer name or phone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border rounded-xl px-4 py-2 text-sm mb-3"
      />

      {/* status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap border ${
              status === s ? 'bg-black text-white border-black' : 'border-gray-200'
            }`}
          >
            {s === 'delivered' ? 'delivered / sold' : s.replace('_', ' ')}
            {s !== 'all' && (
              <span className="ml-1 opacity-60">
                ({orders.filter(o => o.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* list */}
      <div className="space-y-2">
        {filtered.map((order) => (
          <Link
            key={order._id}
            to={`/dashboard/orders/${order._id}`}
            className="block border rounded-xl p-4 hover:bg-gray-50"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-sm">
                  {order.customer?.name || order.guestPhone || 'Guest'}
                </p>
                <p className="text-xs text-gray-500">{order.customer?.phone}</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {order.items.length} item(s) · Ksh {order.totalAmount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.status]}`}>
                  {order.status === 'delivered' && order.paymentType === 'full' ? 'sold' : order.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-gray-400">{order.paymentType}</span>
                {order.paymentType === 'credit' && (
                  <span className="text-xs text-orange-500">
                    Ksh {Math.max(order.totalAmount - (order.walletDiscount || 0) - (order.manualDiscount || 0) - order.paidAmount, 0)} due
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8">No orders found</p>
        )}
      </div>
    </div>
  );
}

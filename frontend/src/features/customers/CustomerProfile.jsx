import { useEffect, useState } from 'react';
import { getCustomer } from '../../api/customers.js';
import { getOrders } from '../../api/orders.js';
import { ListItemSkeleton } from '../../components/Skeleton.jsx';
import { Link } from 'react-router-dom';

const statusColors = {
  pending:           'bg-yellow-100 text-yellow-700',
  partial_delivered: 'bg-blue-100 text-blue-700',
  delivered:         'bg-green-100 text-green-700',
  cancelled:         'bg-red-100 text-red-700',
};

export default function CustomerProfile({ customerId }) {
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      getCustomer(customerId),
      getOrders(),
    ]).then(([c, allOrders]) => {
      setCustomer(c);
      setOrders(allOrders.filter(o => o.customer?._id === customerId));
    }).finally(() => setLoading(false));
  }, [customerId]);

  if (loading)
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <ListItemSkeleton key={i} />)}
      </div>
    );

  if (!customer) return <p className="text-gray-400">Customer not found</p>;

  const totalSpent  = orders.reduce((s, o) => s + o.paidAmount, 0);
  const creditOrders = orders.filter(o => o.paymentType === 'credit' && o.status !== 'delivered');

  return (
    <div className="space-y-6">
      {/* profile card */}
      <div className="border rounded-xl p-4 space-y-1">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xl font-bold">{customer.name}</p>
            <p className="text-gray-500">{customer.phone}</p>
            {customer.email && <p className="text-sm text-gray-400">{customer.email}</p>}
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            customer.registrationType === 'walkin'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-green-100 text-green-700'
          }`}>
            {customer.registrationType}
          </span>
        </div>
        {customer.location?.address && (
          <p className="text-sm text-gray-500">📍 {customer.location.address}</p>
        )}
        {customer.registeredBy && (
          <p className="text-xs text-gray-400">Registered by: {customer.registeredBy.name}</p>
        )}
      </div>

      {/* stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">{orders.length}</p>
          <p className="text-xs text-gray-500">Orders</p>
        </div>
        <div className="border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{totalSpent.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Ksh Spent</p>
        </div>
        <div className="border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{customer.walletBalance}</p>
          <p className="text-xs text-gray-500">Wallet (Ksh)</p>
        </div>
      </div>

      {/* pending credit orders */}
      {creditOrders.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="font-semibold text-yellow-800 mb-2">⏳ Pending Credit Orders</p>
          {creditOrders.map(o => (
            <div key={o._id} className="flex justify-between text-sm py-1">
              <span>Ksh {o.totalAmount - o.paidAmount} remaining</span>
              <Link
                to={`/dashboard/orders/${o._id}`}
                className="text-blue-600 underline"
              >
                View
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* order history */}
      <div>
        <p className="font-semibold mb-3">Order History</p>
        {orders.length === 0 && (
          <p className="text-gray-400 text-sm">No orders yet</p>
        )}
        <div className="space-y-2">
          {orders.map((o) => (
            <Link
              key={o._id}
              to={`/dashboard/orders/${o._id}`}
              className="flex justify-between items-center border rounded-xl p-3 hover:bg-gray-50"
            >
              <div>
                <p className="text-sm font-medium">
                  {o.items.length} item(s) · Ksh {o.totalAmount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(o.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[o.status]}`}>
                {o.status.replace('_', ' ')}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

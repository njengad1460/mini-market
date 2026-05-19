import { useEffect, useState } from 'react';
import { getOrders } from '../../api/orders.js';
import OrderList from '../../features/orders/OrderList.jsx';

export default function OrdersPage() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders().then(setOrders).finally(() => setLoading(false));
  }, []);

  // summary counts
  const pending  = orders.filter(o => o.status === 'pending').length;
  const credit   = orders.filter(o => o.paymentType === 'credit' && o.status !== 'delivered').length;

  if (loading) return <div className="p-8 text-center text-gray-400">Loading orders...</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Orders</h1>

      {/* quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">{orders.length}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">{pending}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div className="border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-orange-500">{credit}</p>
          <p className="text-xs text-gray-500">On Credit</p>
        </div>
      </div>

      <OrderList orders={orders} />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { getSpecialOrders } from '../../api/specialOrders.js';
import KanbanBoard from '../../features/specialOrders/KanbanBoard.jsx';

export default function SpecialOrdersPage() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () =>
    getSpecialOrders().then(setOrders).finally(() => setLoading(false));

  useEffect(() => { fetchOrders(); }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Special Orders</h1>
        <p className="text-sm text-gray-500">{orders.length} total</p>
      </div>
      <KanbanBoard orders={orders} onUpdate={fetchOrders} />
    </div>
  );
}

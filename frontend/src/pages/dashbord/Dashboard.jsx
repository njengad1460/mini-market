import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOverview } from '../../api/analytics.js';
import useAuthStore from '../../store/authStore.js';

const StatCard = ({ label, value }) => (
  <div className="border rounded-xl p-4">
    <p className="text-gray-500 text-sm">{label}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
);

const navLinks = [
  { to: '/dashboard/orders',        label: '📦 Orders' },
  { to: '/dashboard/customers',     label: '👥 Customers' },
  { to: '/dashboard/inventory',     label: '👟 Inventory' },
  { to: '/dashboard/special-orders',label: '📸 Special Orders' },
  { to: '/dashboard/cash',          label: '💵 Cash Session' },
];

export default function Dashboard() {
  const { role }                = useAuthStore();
  const [stats, setStats]       = useState(null);

  useEffect(() => {
    if (role === 'admin') getOverview().then(setStats).catch(() => {});
  }, [role]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {role === 'admin' && stats && (
        <div className="grid gap-4 mb-8 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Orders"    value={stats.totalOrders} />
          <StatCard label="Total Customers" value={stats.totalCustomers} />
          <StatCard label="Revenue (Ksh)"   value={stats.totalRevenue.toLocaleString()} />
          <StatCard label="Invested (Ksh)"  value={stats.totalInvested.toLocaleString()} />
          <StatCard label="Sold (Ksh)"      value={stats.totalSold.toLocaleString()} />
          <StatCard label="Outstanding Credit (Ksh)" value={stats.totalOutstandingCredit.toLocaleString()} />
          <StatCard label="Customer Credits (Ksh)" value={stats.totalCustomerCredits.toLocaleString()} />
          <StatCard label="Customer Debits (Ksh)" value={stats.totalCustomerDebits.toLocaleString()} />
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="border rounded-xl p-4 text-center font-medium hover:bg-gray-50"
          >
            {link.label}
          </Link>
        ))}
        {role === 'admin' && (
          <Link
            to="/dashboard/analytics"
            className="border rounded-xl p-4 text-center font-medium hover:bg-gray-50"
          >
            📊 Analytics
          </Link>
        )}
        {role === 'admin' && (
          <Link
            to="/dashboard/users"
            className="border rounded-xl p-4 text-center font-medium hover:bg-gray-50"
          >
            👤 User Management
          </Link>
        )}
      </div>
    </div>
  );
}

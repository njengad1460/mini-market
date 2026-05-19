import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore.js';
import useCartStore from './store/cartStore.js';
import Toast from './components/Toast.jsx';

import Catalog          from './pages/public/Catalog.jsx';
import ProductDetail    from './pages/public/ProductDetail.jsx';
import Cart             from './pages/public/Cart.jsx';
import Checkout         from './pages/public/Checkout.jsx';
import OrderSuccess     from './pages/public/OrderSuccess.jsx';
import RequestShoe      from './pages/public/RequestShoe.jsx';
import Login            from './pages/auth/Login.jsx';
import Signup           from './pages/auth/Signup.jsx';
import CompleteProfile  from './pages/auth/CompleteProfile.jsx';
import SettingsPage     from './pages/settings/SettingsPage.jsx';
import Dashboard        from './pages/dashbord/Dashboard.jsx';
import CustomersPage, { CustomerDetailPage } from './pages/customers/CustomersPage.jsx';
import OrdersPage       from './pages/orders/OrdersPage.jsx';
import OrderDetailPage  from './pages/orders/OrderDetailPage.jsx';
import InventoryPage    from './pages/inventory/InventoryPage.jsx';
import SpecialOrdersPage from './pages/specialOrder/SpecialOrdersPage.jsx';
import Analytics        from './pages/dashbord/Analytics.jsx';
import CashFloatPage    from './pages/cash/CashFloatPage.jsx';
import UserManagementPage from './pages/settings/UserManagementPage.jsx';

// Protects routes that require staff or admin
function StaffRoute({ children }) {
  const { user, role, loading } = useAuthStore();
  if (loading) return null;
  if (!user || role === 'customer') return <Navigate to="/login" replace />;
  return children;
}

// Protects routes that require admin only
function AdminRoute({ children }) {
  const { user, role, loading } = useAuthStore();
  if (loading) return null;
  if (!user || role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function Navbar() {
  const { user, role, logout } = useAuthStore();
  const items                  = useCartStore((s) => s.items);
  const navigate               = useNavigate();

  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <nav className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white z-10">
      <Link to="/" className="font-bold text-lg">👟 Narok Shoes</Link>
      <div className="flex items-center gap-4 text-sm">
        <Link to="/request-shoe">Request Shoe</Link>
        {user && role === 'customer' && (
          <Link to="/settings">Settings</Link>
        )}
        {(role === 'staff' || role === 'admin') && (
          <Link to="/dashboard" className="text-blue-600 font-medium">Dashboard</Link>
        )}
        <Link to="/cart" className="relative">
          🛒
          {items.length > 0 && (
            <span className="absolute -top-1 -right-2 bg-black text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {items.length}
            </span>
          )}
        </Link>
        {user ? (
          <button onClick={handleLogout} className="text-gray-500">Logout</button>
        ) : (
          <Link to="/login" className="bg-black text-white px-3 py-1.5 rounded-lg">Login</Link>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => { init(); }, []);

  return (
    <BrowserRouter>
      <Navbar />
      <Toast />
      <Routes>
        {/* public */}
        <Route path="/"             element={<Catalog />} />
        <Route path="/shoes/:id"    element={<ProductDetail />} />
        <Route path="/cart"         element={<Cart />} />
        <Route path="/request-shoe" element={<RequestShoe />} />
        <Route path="/login"            element={<Login />} />
        <Route path="/signup"           element={<Signup />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/checkout"         element={<Checkout />} />
        <Route path="/order-success"    element={<OrderSuccess />} />
        <Route path="/settings"         element={<SettingsPage />} />

        {/* staff + admin */}
        <Route path="/dashboard" element={<StaffRoute><Dashboard /></StaffRoute>} />
        <Route path="/dashboard/orders" element={<StaffRoute><OrdersPage /></StaffRoute>} />
        <Route path="/dashboard/orders/:id" element={<StaffRoute><OrderDetailPage /></StaffRoute>} />
        <Route path="/dashboard/customers" element={<StaffRoute><CustomersPage /></StaffRoute>} />
        <Route path="/dashboard/customers/:id" element={<StaffRoute><CustomerDetailPage /></StaffRoute>} />
        <Route path="/dashboard/inventory" element={<StaffRoute><InventoryPage /></StaffRoute>} />
        <Route path="/dashboard/special-orders" element={<StaffRoute><SpecialOrdersPage /></StaffRoute>} />
        <Route path="/dashboard/cash"           element={<StaffRoute><CashFloatPage /></StaffRoute>} />

        {/* admin only */}
        <Route path="/dashboard/analytics"    element={<AdminRoute><Analytics /></AdminRoute>} />
        <Route path="/dashboard/users"        element={<AdminRoute><UserManagementPage /></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

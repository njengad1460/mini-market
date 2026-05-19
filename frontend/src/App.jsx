import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore.js';
import useCartStore from './store/cartStore.js';
import useI18n from './i18n/index.js';
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

function CustomerRoute({ children }) {
  const { user, role, loading } = useAuthStore();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (role !== 'customer') return <Navigate to={role === 'admin' || role === 'staff' ? '/dashboard' : '/'} replace />;
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
  const { user, role, loading, logout } = useAuthStore();
  const items                  = useCartStore((s) => s.items);
  const lang                   = useI18n((s) => s.lang);
  const setLang                = useI18n((s) => s.setLang);
  const t                      = useI18n((s) => s.t);
  const navigate               = useNavigate();

  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-border)] backdrop-blur-md">
      <div className="bg-[#ffa726] text-[#212121]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2 text-sm font-semibold sm:flex-row sm:items-center sm:justify-between">
          <p>{t('nav.promo')}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-extrabold">{t('nav.deliveryTag')}</span>
            <Link to="/request-shoe" className="rounded-full bg-white px-4 py-1.5 text-xs font-bold transition hover:bg-[#fff5e6]">
              {t('nav.shopNow')}
            </Link>
          </div>
        </div>
      </div>

      <nav className="bg-[rgba(250,248,243,0.94)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(46,125,50,0.22)]">
                NS
              </div>
              <div>
                <p className="text-lg font-extrabold tracking-tight">Narok Shoes</p>
                <p className="text-xs text-[#5b5b5b]">{t('nav.subtitle')}</p>
              </div>
            </Link>

            <Link
              to="/cart"
              className="relative rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold lg:hidden"
            >
              {t('nav.cart')}
              {items.length > 0 && (
                <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[var(--color-primary)] px-1.5 py-0.5 text-center text-[11px] text-white">
                  {items.length}
                </span>
              )}
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-[#3f3f3f]">
            <Link to="/" className="rounded-full px-3 py-2 transition hover:bg-white">{t('nav.home')}</Link>
            <Link to="/request-shoe" className="rounded-full px-3 py-2 transition hover:bg-white">{t('nav.requestShoe')}</Link>
            {user && role === 'customer' && (
              <Link to="/settings" className="rounded-full px-3 py-2 transition hover:bg-white">{t('nav.settings')}</Link>
            )}
            {(role === 'staff' || role === 'admin') && (
              <Link to="/dashboard" className="rounded-full px-3 py-2 font-semibold text-[var(--color-primary)] transition hover:bg-white">
                Dashboard
              </Link>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setLang(lang === 'en' ? 'sw' : 'en')}
              className="soft-button rounded-full px-4 py-2 text-sm font-semibold"
            >
              {lang === 'en' ? 'Kiswahili' : 'English'}
            </button>

            <Link
              to="/cart"
              className="relative hidden rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold transition hover:border-[var(--color-primary)] lg:inline-flex"
            >
              {t('nav.cart')}
              {items.length > 0 && (
                <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[var(--color-primary)] px-1.5 py-0.5 text-center text-[11px] text-white">
                  {items.length}
                </span>
              )}
            </Link>

            {loading ? null : user ? (
              <button onClick={handleLogout} className="rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[#5b5b5b] transition hover:border-[var(--color-primary)]">
                {t('nav.logout')}
              </button>
            ) : (
              <Link to="/login" className="cta-button rounded-full px-5 py-2.5 text-sm font-bold transition">
                {t('nav.login')}
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

export default function App() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => { init(); }, [init]);

  return (
    <BrowserRouter>
      <Navbar />
      <Toast />
      <main className="pb-10">
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
          <Route path="/settings"         element={<CustomerRoute><SettingsPage /></CustomerRoute>} />

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
      </main>
    </BrowserRouter>
  );
}

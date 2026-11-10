import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate, useSearchParams, useLocation } from 'react-router-dom';
import { Hub } from 'aws-amplify/utils';
import useAuthStore from './store/authStore.js';
import useCartStore from './store/cartStore.js';
import useI18n from './i18n/index.js';
import Toast from './components/Toast.jsx';
import NotificationBell from './components/NotificationBell.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

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

function AuthCallback() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [errorMsg, setErrorMsg] = useState(searchParams.get('error_description') || searchParams.get('error'));
  
  // Listen for Hub failures if the URL didn't already have an error
  useEffect(() => {
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signInWithRedirect_failure') {
        setErrorMsg(payload.data?.message || 'Authentication failed during OAuth flow.');
      }
    });
    return unsubscribe;
  }, []);

  if (errorMsg) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-xl font-bold text-red-600 mb-2">Authentication Error</h2>
        <p className="text-gray-700">{errorMsg}</p>
        <Link to="/login" className="text-blue-500 hover:underline mt-4 inline-block">Return to Login</Link>
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;
  
  // If there's an OAuth code or state in the URL, wait for Amplify Hub to process it.
  if (searchParams.has('code') || searchParams.has('state')) {
    return <div className="text-center mt-20 font-semibold">Completing authentication...</div>;
  }

  return <Navigate to="/login" replace />;
}

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

function Footer() {
  return (
    <footer className="bg-[#212121] text-white py-8 mt-auto border-t border-[#333]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-8 md:grid-cols-3">
        <div>
          <h4 className="text-lg font-extrabold mb-4 text-[var(--color-accent)]">Narok Shoes</h4>
          <p className="text-sm text-gray-400">Premium footwear delivered fast. Your comfort, our priority.</p>
        </div>
        <div>
          <h4 className="text-lg font-extrabold mb-4 text-[var(--color-accent)]">Contact Us</h4>
          <p className="text-sm text-gray-400 mb-2">Phone: <a href="tel:0113456059" className="hover:text-white transition">0113456059</a></p>
          <p className="text-sm text-gray-400">Email: <a href="mailto:njengadavid1460@gmail.com" className="hover:text-white transition">njengadavid1460@gmail.com</a></p>
        </div>
        <div>
          <h4 className="text-lg font-extrabold mb-4 text-[var(--color-accent)]">Quick Links</h4>
          <div className="flex flex-col gap-2 text-sm text-gray-400">
            <Link to="/" className="hover:text-white transition">Home</Link>
            <Link to="/request-shoe" className="hover:text-white transition">Request a Shoe</Link>
            <Link to="/cart" className="hover:text-white transition">Cart</Link>
          </div>
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-[#333] text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} Narok Shoes. All rights reserved.
      </div>
    </footer>
  );
}

function Navbar() {
  const { user, role, loading, logout } = useAuthStore();
  const items                  = useCartStore((s) => s.items);
  const lang                   = useI18n((s) => s.lang);
  const setLang                = useI18n((s) => s.setLang);
  const t                      = useI18n((s) => s.t);
  const navigate               = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <header className="sticky top-0 z-20 glass">
      <div className="bg-[var(--color-accent)] text-[var(--color-text)]">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between gap-3 px-4 text-[11px] font-semibold tracking-wide sm:h-9 sm:text-[12px]">
          <div className="min-w-0 flex-1 overflow-hidden whitespace-nowrap leading-none">
            <marquee scrollamount="5" className="w-full">
              In case of any question, call this number for help: <strong>0113456059</strong> &nbsp;&nbsp;|&nbsp;&nbsp; {t('nav.promo')}
            </marquee>
          </div>
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">{t('nav.deliveryTag')}</span>
            <Link to="/request-shoe" className="rounded-full bg-[rgba(33,33,33,0.16)] px-3 py-1 text-[10px] font-bold text-white transition hover:bg-[rgba(33,33,33,0.28)]">
              {t('nav.shopNow')}
            </Link>
          </div>
        </div>
      </div>

      <nav>
        <div className="mx-auto flex max-w-7xl flex-col px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between w-full">
            <Link to="/" className="flex items-center gap-2 flex-shrink-0 min-w-0">
              <img 
                src="/logo.png" 
                alt="Narok Shoes Logo" 
                className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl object-cover shadow-md flex-shrink-0"
              />
              <div className="hidden min-[400px]:block min-w-0">
                <p className="truncate text-base sm:text-lg font-extrabold tracking-tight text-[var(--color-text)] sm:text-xl">Narok Shoes</p>
                <p className="hidden sm:block truncate text-xs text-[var(--color-text-muted)] font-medium">{t('nav.subtitle')}</p>
              </div>
            </Link>

            <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden flex-shrink-0">
              <Link
                to="/request-shoe"
                className="rounded-full bg-[var(--color-accent)] px-2.5 py-1 text-[11px] sm:px-3 sm:py-1.5 sm:text-xs font-bold text-[#212121] shadow-sm whitespace-nowrap"
              >
                {t('nav.requestShoe')}
              </Link>
              {loading ? null : !user && (
                <Link
                  to="/login"
                  className="rounded-full border border-[var(--color-border)] bg-white px-2.5 py-1 text-[11px] sm:px-3 sm:py-1.5 sm:text-xs font-semibold text-gray-700 shadow-sm whitespace-nowrap"
                >
                  {t('nav.login') || 'Login'}
                </Link>
              )}
              <Link
                to="/cart"
                className="relative rounded-full border border-[var(--color-border)] bg-white px-2.5 py-1 sm:px-3.5 sm:py-1.5 text-xs sm:text-sm font-semibold shadow-sm flex items-center"
              >
                {t('nav.cart')}
                {items.length > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-4 sm:min-w-5 rounded-full bg-[var(--color-accent)] px-1 sm:px-1.5 py-0.5 text-center text-[9px] sm:text-[11px] text-[#212121] font-bold shadow-sm">
                    {items.length}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-1 sm:p-2 text-gray-600 rounded-lg hover:bg-gray-100 transition focus:outline-none"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>

          <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row gap-4 lg:gap-3 lg:items-center w-full lg:w-auto mt-4 lg:mt-0`}>
            <div className="flex flex-col lg:flex-row lg:items-center gap-2 text-[15px] lg:text-sm text-[#3f3f3f] font-medium">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="rounded-xl px-3 py-2 transition hover:bg-gray-50">{t('nav.home')}</Link>
              <Link to="/request-shoe" onClick={() => setIsMobileMenuOpen(false)} className="rounded-xl px-3 py-2 transition hover:bg-gray-50">{t('nav.requestShoe')}</Link>
              {user && role === 'customer' && (
                <Link to="/settings" onClick={() => setIsMobileMenuOpen(false)} className="rounded-xl px-3 py-2 transition hover:bg-gray-50">{t('nav.settings')}</Link>
              )}
              {(role === 'staff' || role === 'admin') && (
                <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="rounded-xl px-3 py-2 font-bold text-[var(--color-primary)] transition hover:bg-gray-50">
                  Dashboard
                </Link>
              )}
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center gap-3 border-t lg:border-none border-gray-200 pt-3 lg:pt-0">
              <button
                onClick={() => { setLang(lang === 'en' ? 'sw' : 'en'); setIsMobileMenuOpen(false); }}
                className="soft-button w-full lg:w-auto rounded-xl lg:rounded-full px-4 py-2.5 lg:py-2 text-sm font-bold text-center"
              >
                {lang === 'en' ? 'Kiswahili' : 'English'}
              </button>

              <NotificationBell />

              <Link
                to="/cart"
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative hidden lg:inline-flex rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold transition hover:border-[var(--color-primary)]"
              >
                {t('nav.cart')}
                {items.length > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 text-center text-[11px] text-[#212121] font-bold shadow-sm">
                    {items.length}
                  </span>
                )}
              </Link>

              {loading ? null : user ? (
                <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="w-full lg:w-auto rounded-xl lg:rounded-full border border-[var(--color-border)] bg-white px-4 py-2.5 lg:py-2 text-sm font-semibold text-[#5b5b5b] transition hover:border-[var(--color-primary)]">
                  {t('nav.logout')}
                </button>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full lg:w-auto rounded-xl lg:rounded-full border border-[var(--color-border)] bg-white px-4 py-2.5 lg:py-2 text-sm font-semibold text-[#5b5b5b] transition hover:border-[var(--color-primary)] text-center">
                    {t('nav.login')}
                  </Link>
                  <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="cta-button w-full lg:w-auto text-center rounded-xl lg:rounded-full px-5 py-3 lg:py-2.5 text-sm font-bold transition">
                    {t('auth.signup') || 'Sign Up'}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => { 
    init(); 
    
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signInWithRedirect' || payload.event === 'signedIn') {
        init();
      }
    });

    return unsubscribe;
  }, [init]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <Toast />
        <main className="flex-1 pb-10">
        <ErrorBoundary>
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
          <Route path="/auth/callback"    element={<AuthCallback />} />

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
        </ErrorBoundary>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

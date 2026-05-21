import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../../store/cartStore.js';
import useAuthStore from '../../store/authStore.js';
import useToastStore from '../../store/toastStore.js';
import { placeOrder } from '../../api/orders.js';
import client from '../../api/client.js';

export default function Checkout() {
  const { items, fetchCart, total } = useCartStore();
  const { user }                    = useAuthStore();
  const toast                       = useToastStore((s) => s.show);
  const navigate                    = useNavigate();
  const [customer, setCustomer]     = useState(user ? undefined : null);
  const [paymentType, setPaymentType] = useState('full');
  const [walletDiscount, setWalletDiscount] = useState(0);
  const [orderType, setOrderType]   = useState('direct');
  const [guestPhone, setGuestPhone] = useState('');
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    let cancelled = false;

    if (!user) return undefined;

    client.post('/api/auth/sync')
      .then((r) => {
        if (cancelled) return;
        setCustomer(r.data.customer || null);
      })
      .catch(() => {
        if (cancelled) return;
        setCustomer(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const grandTotal = total() - walletDiscount;
  const showGuestPhone = !user;
  const waitingOnCustomer = !!user && customer === undefined;

  const handleOrder = async () => {
    if (items.length === 0) return;
    if (showGuestPhone && !guestPhone.trim()) {
      toast('Please enter a phone number', 'error');
      return;
    }
    if (waitingOnCustomer) {
      toast('We are still loading your profile. Please try again in a moment.', 'error');
      return;
    }

    setLoading(true);
    try {
      const orderItems = items.map((i) => ({
        shoe:     i.shoe._id,
        size:     i.size,
        quantity: i.quantity,
        price:    i.shoe.price,
      }));

      await placeOrder({
        items:          orderItems,
        paymentType,
        orderType,
        walletDiscount,
        guestPhone:     showGuestPhone ? guestPhone.trim() : '',
      });

      await fetchCart();
      navigate('/order-success');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to place order', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0)
    return (
      <div className="p-8 text-center max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold mb-8">Checkout</h1>
        <div className="flex flex-col items-center justify-center space-y-4 bg-gray-50 rounded-2xl py-12 px-4">
          <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <p className="text-gray-500 font-medium">Your cart is empty</p>
          <button 
            onClick={() => navigate('/')} 
            className="mt-4 bg-black text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );

  return (
    <div className="p-4 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>

      {/* order summary */}
      <div className="border rounded-xl p-4 space-y-2">
        <p className="font-semibold mb-2">Order Summary</p>
        {items.map((item) => (
          <div key={`${item.shoe._id}-${item.size}`} className="flex justify-between text-sm">
            <span>{item.shoe.name} · Size {item.size} x{item.quantity}</span>
            <span>Ksh {item.shoe.price * item.quantity}</span>
          </div>
        ))}
        <div className="border-t pt-2 flex justify-between font-bold">
          <span>Total</span>
          <span>Ksh {total()}</span>
        </div>
      </div>

      {/* order type */}
      <div className="border rounded-xl p-4 space-y-2">
        <p className="font-semibold">Order Type</p>
        <div className="flex gap-2">
          {[
            { value: 'direct',         label: 'Buy Now' },
            { value: 'sample_request', label: 'Sample Request' },
          ].map((o) => (
            <button
              key={o.value}
              onClick={() => setOrderType(o.value)}
              className={`flex-1 py-2 rounded-xl border text-sm ${
                orderType === o.value ? 'bg-black text-white' : ''
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* payment type */}
      <div className="border rounded-xl p-4 space-y-2">
        <p className="font-semibold">Payment Plan</p>
        <div className="flex gap-2">
          {[
            { value: 'full',   label: 'Pay in Full' },
            { value: 'credit', label: 'Lipa Pole Pole' },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPaymentType(p.value)}
              className={`flex-1 py-2 rounded-xl border text-sm ${
                paymentType === p.value ? 'bg-black text-white' : ''
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {paymentType === 'credit' && (
          <p className="text-xs text-yellow-700 bg-yellow-50 rounded-lg p-2">
            First shoe delivered on first payment. Second shoe on completion.
          </p>
        )}
      </div>

      {/* wallet discount */}
      {customer && customer !== false && customer.walletBalance > 0 && (
        <div className="border rounded-xl p-4 space-y-2">
          <p className="font-semibold">Wallet Balance: Ksh {customer.walletBalance}</p>
          <input
            type="number"
            placeholder="Amount to use as discount"
            max={customer.walletBalance}
            value={walletDiscount}
            onChange={(e) => setWalletDiscount(Math.min(Number(e.target.value), customer.walletBalance))}
            className="w-full border rounded-xl px-4 py-2 text-sm"
          />
        </div>
      )}

      {/* guest phone if not logged in */}
      {showGuestPhone && (
        <div className="border rounded-xl p-4 space-y-2">
          <p className="font-semibold">Contact Details</p>
          <input
            type="tel"
            placeholder="Phone Number (e.g. 07...)"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            className="w-full border rounded-xl px-4 py-2 text-sm"
            required
          />
        </div>
      )}

      {/* grand total */}
      <div className="flex justify-between text-xl font-bold px-1">
        <span>Grand Total</span>
        <span className="text-green-600">Ksh {grandTotal}</span>
      </div>

      <button
        onClick={handleOrder}
        disabled={loading || waitingOnCustomer}
        className="w-full bg-black text-white py-3 rounded-xl font-semibold"
      >
        {loading ? 'Placing Order...' : waitingOnCustomer ? 'Loading Profile...' : 'Place Order'}
      </button>
    </div>
  );
}

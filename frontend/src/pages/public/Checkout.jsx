import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../../store/cartStore.js';
import useAuthStore from '../../store/authStore.js';
import { placeOrder } from '../../api/orders.js';
import client from '../../api/client.js';

export default function Checkout() {
  const { items, fetchCart, total } = useCartStore();
  const { user }                    = useAuthStore();
  const navigate                    = useNavigate();
  const [customer, setCustomer]     = useState(null);
  const [paymentType, setPaymentType] = useState('full');
  const [walletDiscount, setWalletDiscount] = useState(0);
  const [orderType, setOrderType]   = useState('direct');
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    fetchCart();
    client.get('/api/auth/sync', { method: 'POST' });
    // fetch customer profile for wallet balance
    client.post('/api/auth/sync').then(r => setCustomer(r.data.customer)).catch(() => {});
  }, []);

  const grandTotal = total() - walletDiscount;

  const handleOrder = async () => {
    if (items.length === 0) return;
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
        customerId:     customer?._id,
      });

      navigate('/order-success');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0)
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Your cart is empty</p>
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
      {customer?.walletBalance > 0 && (
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

      {/* grand total */}
      <div className="flex justify-between text-xl font-bold px-1">
        <span>Grand Total</span>
        <span className="text-green-600">Ksh {grandTotal}</span>
      </div>

      <button
        onClick={handleOrder}
        disabled={loading}
        className="w-full bg-black text-white py-3 rounded-xl font-semibold"
      >
        {loading ? 'Placing Order...' : 'Place Order'}
      </button>
    </div>
  );
}

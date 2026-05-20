import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import client from '../../api/client.js';
import { recordDelivery, payInstallment, applyDiscount, completeOrder } from '../../api/orders.js';
import useAuthStore from '../../store/authStore.js';

export default function OrderDetailPage() {
  const { id }              = useParams();
  const { role }            = useAuthStore();
  const [order, setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);

  // form states
  const [shoe, setShoe]           = useState('left');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [installmentMethod, setInstallmentMethod] = useState('cash');
  const [installmentRef, setInstallmentRef]       = useState('');
  const [completionMethod, setCompletionMethod] = useState('cash');
  const [completionRef, setCompletionRef] = useState('');
  const [discount, setDiscount]   = useState('');

  const fetchOrder = useCallback(
    () => client.get(`/api/orders/${id}`).then((r) => {
      setOrder(r.data);
      setLoading(false);
    }),
    [id]
  );

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  if (loading || !order) return <div className="p-8 text-center">Loading...</div>;

  const handleDelivery = async () => {
    await recordDelivery(id, { shoe, location: deliveryLocation });
    fetchOrder();
  };

  const handleInstallment = async () => {
    await payInstallment(id, {
      amount: Number(installmentAmount),
      paymentMethod: installmentMethod,
      reference: installmentRef,
    });
    setInstallmentAmount('');
    setInstallmentMethod('cash');
    setInstallmentRef('');
    fetchOrder();
  };

  const handleDiscount = async () => {
    await applyDiscount(id, { discount: Number(discount) });
    fetchOrder();
  };

  const handleCompleteOrder = async () => {
    await completeOrder(id, {
      paymentMethod: completionMethod,
      reference: completionRef,
    });
    setCompletionMethod('cash');
    setCompletionRef('');
    fetchOrder();
  };

  const deliveredShoes = order.deliveries.map(d => d.shoe);
  const netTotal = Math.max(order.totalAmount - (order.walletDiscount || 0) - (order.manualDiscount || 0), 0);
  const remainingBalance = Math.max(netTotal - (order.paidAmount || 0), 0);
  const allowPartialDelivery = order.paymentType === 'credit' && order.orderType === 'direct';

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Order Detail</h1>

      {/* summary */}
      <div className="border rounded-xl p-4 space-y-1">
        <p><span className="font-medium">Customer:</span> {order.customer?.name || order.guestPhone}</p>
        <p><span className="font-medium">Phone:</span> {order.customer?.phone}</p>
        <p><span className="font-medium">Gross Total:</span> Ksh {order.totalAmount}</p>
        <p><span className="font-medium">Net Total:</span> Ksh {netTotal}</p>
        <p><span className="font-medium">Paid:</span> Ksh {order.paidAmount}</p>
        <p><span className="font-medium">Remaining:</span> Ksh {remainingBalance}</p>
        <p><span className="font-medium">Payment:</span> {order.paymentType}</p>
        <p><span className="font-medium">Order Type:</span> {order.orderType.replace('_', ' ')}</p>
        <p><span className="font-medium">Status:</span> {order.status.replace('_', ' ')}</p>
        {order.manualDiscount > 0 && (
          <p><span className="font-medium">Discount:</span> Ksh {order.manualDiscount}</p>
        )}
      </div>

      {/* items */}
      <div className="border rounded-xl p-4">
        <p className="font-semibold mb-2">Items</p>
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0">
            <span>{item.shoe?.name} — Size {item.size}</span>
            <span>Ksh {item.price * item.quantity}</span>
          </div>
        ))}
      </div>

      {/* deliveries */}
      <div className="border rounded-xl p-4">
        <p className="font-semibold mb-2">Deliveries</p>
        {order.deliveries.length === 0 && <p className="text-sm text-gray-400">No deliveries yet</p>}
        {order.deliveries.map((d, i) => (
          <div key={i} className="text-sm py-1 border-b last:border-0">
            <span className="capitalize font-medium">{d.shoe} shoe</span> — by {d.deliveredBy?.name} · {new Date(d.deliveredAt).toLocaleDateString()}
            {d.location && <span className="text-gray-400"> · {d.location}</span>}
          </div>
        ))}
        {!allowPartialDelivery && (
          <p className="text-sm text-gray-500">Left/right delivery tracking is only used for direct credit orders.</p>
        )}
      </div>

      {/* record delivery — staff/admin */}
      {(role === 'staff' || role === 'admin') && order.status !== 'delivered' && allowPartialDelivery && (
        <div className="border rounded-xl p-4 space-y-3">
          <p className="font-semibold">Record Delivery</p>
          <div className="flex gap-3">
            {['left', 'right'].map((s) => (
              <button
                key={s}
                onClick={() => setShoe(s)}
                disabled={deliveredShoes.includes(s)}
                className={`flex-1 py-2 rounded-xl border text-sm capitalize ${
                  shoe === s ? 'bg-black text-white' : ''
                } disabled:opacity-40`}
              >
                {s} Shoe {deliveredShoes.includes(s) ? '✓' : ''}
              </button>
            ))}
          </div>
          <input
            placeholder="Delivery location / address"
            value={deliveryLocation}
            onChange={(e) => setDeliveryLocation(e.target.value)}
            className="w-full border rounded-xl px-4 py-2 text-sm"
          />
          <button
            onClick={handleDelivery}
            className="w-full bg-black text-white py-2 rounded-xl text-sm"
          >
            Record Delivery
          </button>
        </div>
      )}

      {/* pay installment */}
      {order.paymentType === 'credit' && order.status !== 'delivered' && (
        <div className="border rounded-xl p-4 space-y-3">
          <p className="font-semibold">Record Installment Payment</p>
          <input
            type="number"
            placeholder="Amount (Ksh)"
            value={installmentAmount}
            onChange={(e) => setInstallmentAmount(e.target.value)}
            className="w-full border rounded-xl px-4 py-2 text-sm"
          />
          <div className="flex gap-2">
            {['cash', 'mpesa'].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setInstallmentMethod(method)}
                className={`flex-1 rounded-xl border py-2 text-sm capitalize ${
                  installmentMethod === method ? 'bg-black text-white' : ''
                }`}
              >
                {method}
              </button>
            ))}
          </div>
          <input
            placeholder={installmentMethod === 'mpesa' ? 'M-Pesa reference' : 'Cash reference (optional)'}
            value={installmentRef}
            onChange={(e) => setInstallmentRef(e.target.value)}
            className="w-full border rounded-xl px-4 py-2 text-sm"
          />
          <button
            onClick={handleInstallment}
            className="w-full bg-green-600 text-white py-2 rounded-xl text-sm"
          >
            Record Payment
          </button>
        </div>
      )}

      {/* apply discount — staff/admin */}
      {(role === 'staff' || role === 'admin') && !order.manualDiscount && order.status !== 'delivered' && (
        <div className="border rounded-xl p-4 space-y-3">
          <p className="font-semibold">Apply Discount</p>
          <input
            type="number"
            placeholder="Discount amount (Ksh)"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            className="w-full border rounded-xl px-4 py-2 text-sm"
          />
          <button
            onClick={handleDiscount}
            className="w-full bg-yellow-500 text-white py-2 rounded-xl text-sm"
          >
            Apply Discount
          </button>
        </div>
      )}

      {(role === 'staff' || role === 'admin') && order.status !== 'delivered' && !allowPartialDelivery && (
        <div className="border rounded-xl p-4 space-y-3">
          <p className="font-semibold">{remainingBalance > 0 ? 'Complete Sale' : 'Complete Order'}</p>
          <p className="text-sm text-gray-500">
            {remainingBalance > 0
              ? `This will record the remaining Ksh ${remainingBalance} and mark the order as completed.`
              : 'This will mark the order as completed.'}
          </p>
          {remainingBalance > 0 && (
            <>
              <div className="flex gap-2">
                {['cash', 'mpesa'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setCompletionMethod(method)}
                    className={`flex-1 rounded-xl border py-2 text-sm capitalize ${
                      completionMethod === method ? 'bg-black text-white' : ''
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
              <input
                placeholder={completionMethod === 'mpesa' ? 'M-Pesa reference' : 'Cash reference (optional)'}
                value={completionRef}
                onChange={(e) => setCompletionRef(e.target.value)}
                className="w-full border rounded-xl px-4 py-2 text-sm"
              />
            </>
          )}
          <button
            onClick={handleCompleteOrder}
            className="w-full bg-blue-600 text-white py-2 rounded-xl text-sm"
          >
            {remainingBalance > 0 ? 'Complete Sale' : 'Complete Order'}
          </button>
        </div>
      )}
    </div>
  );
}

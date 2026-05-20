import { useEffect, useState } from 'react';
import { getCustomer, updateCustomerBalance } from '../../api/customers.js';
import { getOrders, payInstallment } from '../../api/orders.js';
import { ListItemSkeleton } from '../../components/Skeleton.jsx';
import { Link } from 'react-router-dom';
import useToastStore from '../../store/toastStore.js';

const statusColors = {
  pending:           'bg-yellow-100 text-yellow-700',
  partial_delivered: 'bg-blue-100 text-blue-700',
  delivered:         'bg-green-100 text-green-700',
  cancelled:         'bg-red-100 text-red-700',
};

export default function CustomerProfile({ customerId }) {
  const toast = useToastStore((s) => s.show);
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [balanceForm, setBalanceForm] = useState({ type: 'credit', amount: '', note: '' });
  const [savingBalance, setSavingBalance] = useState(false);
  const [paymentForms, setPaymentForms] = useState({});
  const [payingOrderId, setPayingOrderId] = useState(null);

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
  const openCreditTotal = creditOrders.reduce((sum, order) => (
    sum + Math.max(order.totalAmount - (order.walletDiscount || 0) - (order.manualDiscount || 0) - order.paidAmount, 0)
  ), 0);

  const handleBalanceUpdate = async (e) => {
    e.preventDefault();
    setSavingBalance(true);
    try {
      const updated = await updateCustomerBalance(customerId, {
        ...balanceForm,
        amount: Number(balanceForm.amount),
      });
      setCustomer(updated);
      setBalanceForm({ type: 'credit', amount: '', note: '' });
      toast('Customer balance updated');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to update balance', 'error');
    } finally {
      setSavingBalance(false);
    }
  };

  const updatePaymentForm = (orderId, patch) => {
    setPaymentForms((current) => ({
      ...current,
      [orderId]: {
        amount: current[orderId]?.amount || '',
        paymentMethod: current[orderId]?.paymentMethod || 'cash',
        reference: current[orderId]?.reference || '',
        ...patch,
      },
    }));
  };

  const handleInstallmentSubmit = async (e, orderId) => {
    e.preventDefault();
    const form = paymentForms[orderId] || { amount: '', paymentMethod: 'cash', reference: '' };
    setPayingOrderId(orderId);

    try {
      const updatedOrder = await payInstallment(orderId, {
        amount: Number(form.amount),
        paymentMethod: form.paymentMethod || 'cash',
        reference: form.reference,
      });

      setOrders((current) => current.map((order) => (
        order._id === orderId ? updatedOrder : order
      )));
      setPaymentForms((current) => ({
        ...current,
        [orderId]: { amount: '', paymentMethod: 'cash', reference: '' },
      }));
      toast('Payment recorded on customer account');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to record payment', 'error');
    } finally {
      setPayingOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* profile card */}
      <div className="surface-card rounded-[2rem] p-5 space-y-2">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4">
            <img
              src={customer.profileImage || '/placeholder.png'}
              alt={customer.name}
              className="h-20 w-20 rounded-[1.3rem] object-cover border border-[var(--color-border)] bg-white"
            />
            <div>
            <p className="text-xl font-bold">{customer.name}</p>
            <p className="text-gray-500">{customer.phone}</p>
            {customer.email && <p className="text-sm text-gray-400">{customer.email}</p>}
            </div>
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
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="surface-card rounded-[1.5rem] p-3 text-center">
          <p className="text-2xl font-bold">{orders.length}</p>
          <p className="text-xs text-gray-500">Orders</p>
        </div>
        <div className="surface-card rounded-[1.5rem] p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{totalSpent.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Ksh Spent</p>
        </div>
        <div className="surface-card rounded-[1.5rem] p-3 text-center">
          <p className={`text-2xl font-bold ${customer.shoeBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {customer.shoeBalance.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">Shoe Balance (Ksh)</p>
        </div>
        <div className="surface-card rounded-[1.5rem] p-3 text-center">
          <p className="text-2xl font-bold text-orange-500">{openCreditTotal.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Open Credit (Ksh)</p>
        </div>
      </div>

      <form onSubmit={handleBalanceUpdate} className="surface-card rounded-[2rem] p-5 space-y-4">
        <div>
          <p className="text-lg font-extrabold">Update shoe balance</p>
          <p className="text-sm text-[#666]">Every change here is logged with the staff member and timestamp.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <select
            value={balanceForm.type}
            onChange={(e) => setBalanceForm({ ...balanceForm, type: e.target.value })}
            className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm"
          >
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
          <input
            type="number"
            min="1"
            placeholder="Amount"
            value={balanceForm.amount}
            onChange={(e) => setBalanceForm({ ...balanceForm, amount: e.target.value })}
            className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm"
            required
          />
          <button type="submit" disabled={savingBalance} className="cta-button rounded-2xl px-4 py-3 text-sm font-extrabold">
            {savingBalance ? 'Saving...' : 'Apply update'}
          </button>
        </div>

        <textarea
          placeholder="Reason or note for this balance update"
          value={balanceForm.note}
          onChange={(e) => setBalanceForm({ ...balanceForm, note: e.target.value })}
          className="min-h-24 w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm"
        />
      </form>

      {/* pending credit orders */}
      {creditOrders.length > 0 && (
        <div className="surface-card rounded-[2rem] p-5">
          <div className="mb-4">
            <p className="text-lg font-extrabold text-yellow-800">Pending credit orders</p>
            <p className="text-sm text-[#666]">Staff and admin can record installments here and the customer will see them in their account.</p>
          </div>

          <div className="space-y-4">
            {creditOrders.map((o) => {
              const remaining = Math.max(o.totalAmount - (o.walletDiscount || 0) - (o.manualDiscount || 0) - o.paidAmount, 0);
              const form = paymentForms[o._id] || { amount: '', paymentMethod: 'cash', reference: '' };

              return (
                <div key={o._id} className="rounded-[1.4rem] border border-yellow-200 bg-yellow-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{o.items.length} item(s) · Ksh {o.totalAmount.toLocaleString()}</p>
                      <p className="text-sm text-[#666]">
                        Paid Ksh {o.paidAmount.toLocaleString()} · Remaining Ksh {remaining.toLocaleString()}
                      </p>
                      <p className="text-xs text-[#7a7a7a]">{new Date(o.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Link to={`/dashboard/orders/${o._id}`} className="text-sm font-semibold text-blue-600 underline">
                      Open order
                    </Link>
                  </div>

                  <form onSubmit={(e) => handleInstallmentSubmit(e, o._id)} className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.9fr_1.2fr_auto]">
                    <input
                      type="number"
                      min="1"
                      max={remaining}
                      placeholder="Installment amount"
                      value={form.amount}
                      onChange={(e) => updatePaymentForm(o._id, { amount: e.target.value })}
                      className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm"
                      required
                    />
                    <select
                      value={form.paymentMethod}
                      onChange={(e) => updatePaymentForm(o._id, { paymentMethod: e.target.value })}
                      className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm"
                    >
                      <option value="cash">Cash</option>
                      <option value="mpesa">M-Pesa</option>
                    </select>
                    <input
                      placeholder={form.paymentMethod === 'mpesa' ? 'M-Pesa reference' : 'Cash reference (optional)'}
                      value={form.reference}
                      onChange={(e) => updatePaymentForm(o._id, { reference: e.target.value })}
                      className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={payingOrderId === o._id}
                      className="cta-button rounded-2xl px-4 py-3 text-sm font-extrabold"
                    >
                      {payingOrderId === o._id ? 'Saving...' : 'Record payment'}
                    </button>
                  </form>

                  {o.installments?.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {o.installments.slice().reverse().map((installment, index) => (
                        <div key={`${o._id}-${index}`} className="rounded-2xl bg-white px-4 py-3 text-sm">
                          <p className="font-semibold text-green-700">Ksh {installment.amount.toLocaleString()}</p>
                          <p className="text-[#666]">
                            {(installment.paymentMethod || 'cash').toUpperCase()} {installment.reference ? `· ${installment.reference}` : ''} · {new Date(installment.paidAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="surface-card rounded-[2rem] p-5">
        <p className="font-semibold mb-3">Balance history</p>
        {customer.balanceUpdates?.length ? (
          <div className="space-y-3">
            {customer.balanceUpdates.map((entry) => (
              <div key={entry._id} className="rounded-[1.4rem] border border-[var(--color-border)] bg-white p-4">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className={`font-extrabold ${entry.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {entry.type === 'credit' ? '+' : '-'}Ksh {entry.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-[#666]">
                      {entry.updatedBy?.name || 'Staff'} changed balance from Ksh {entry.previousValue.toLocaleString()} to Ksh {entry.newValue.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-xs text-[#7a7a7a]">{new Date(entry.updatedAt).toLocaleString()}</p>
                </div>
                {entry.note && <p className="mt-2 text-sm text-[#4f4f4f]">{entry.note}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#666]">No balance updates yet.</p>
        )}
      </div>

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

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfile, updateMyProfile, withdrawWallet } from '../../api/customers.js';
import { getMyOrders } from '../../api/orders.js';
import { getMySpecialOrders } from '../../api/specialOrders.js';
import client from '../../api/client.js';
import useToastStore from '../../store/toastStore.js';

export default function SettingsPage() {
  const toast = useToastStore((s) => s.show);
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    referralCode: '',
    profileImage: '',
  });
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [specialOrders, setSpecialOrders] = useState([]);

  const applyProfile = (profile) => {
    setCustomer(profile);
    setForm({
      name: profile.name || '',
      phone: profile.phone || '',
      address: profile.location?.address || '',
      referralCode: profile.referralCode || '',
      profileImage: profile.profileImage || '',
    });
  };

  useEffect(() => {
    getMyProfile()
      .then((profile) => {
        applyProfile(profile);

        if (!profile.profileComplete) {
          navigate('/complete-profile', { replace: true });
        }
      })
      .catch(async (profileError) => {
        try {
          await client.post('/api/auth/sync', {});
          const profile = await getMyProfile();
          applyProfile(profile);

          if (!profile.profileComplete) {
            navigate('/complete-profile', { replace: true });
          }
        } catch {
          setCustomer({ error: profileError.response?.data?.message || 'Failed to load profile' });
          toast(profileError.response?.data?.message || 'Failed to load profile', 'error');
        }
      });
  }, [navigate, toast]);

  useEffect(() => {
    getMyOrders()
      .then(setOrders)
      .catch(() => {
        setOrders([]);
      });
  }, []);

  useEffect(() => {
    getMySpecialOrders()
      .then(setSpecialOrders)
      .catch(() => {
        setSpecialOrders([]);
      });
  }, []);

  const referralLink = customer
    ? `${window.location.origin}/signup?ref=${customer.referralCode}`
    : '';
  const totalPaid = orders.reduce((sum, order) => sum + (order.paidAmount || 0), 0);
  const openCreditOrders = orders.filter((order) => order.paymentType === 'credit');
  const outstandingBalance = openCreditOrders.reduce((sum, order) => (
    sum + Math.max(order.totalAmount - (order.walletDiscount || 0) - (order.manualDiscount || 0) - (order.paidAmount || 0), 0)
  ), 0);
  const referredCustomers = customer?.referredCustomers || [];
  const qualifiedReferrals = referredCustomers.filter((referral) => referral.hasQualifiedPurchase);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast('Please choose an image file', 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'profiles');
      toast('Uploading image...');
      const { data } = await client.post('/api/upload', formData);
      setForm((current) => ({ ...current, profileImage: data.url }));
      toast('Image uploaded successfully');
    } catch {
      toast('Could not upload that image', 'error');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updated = await updateMyProfile(form);
      setCustomer(updated);
      setForm({
        name: updated.name || '',
        phone: updated.phone || '',
        address: updated.location?.address || '',
        referralCode: updated.referralCode || '',
        profileImage: updated.profileImage || '',
      });
      toast('Profile updated');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      const result = await withdrawWallet();
      setCustomer((current) => ({ ...current, walletBalance: result.remaining }));
      toast(`Ksh ${result.withdrawn} withdrawn`);
    } catch (err) {
      toast(err.response?.data?.message || 'Withdrawal failed', 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  if (!customer) {
    return <div className="mx-auto max-w-5xl px-4 py-10 text-center">Loading profile...</div>;
  }

  if (customer.error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-red-600">Could not load profile</h2>
        <p className="text-gray-600">{customer.error}</p>
        <button onClick={() => window.location.reload()} className="cta-button rounded-xl px-4 py-2 text-sm font-bold mt-4">Try Again</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">My Account</p>
        <h1 className="mt-2 text-3xl font-extrabold">Profile and balances</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={handleSave} className="surface-card rounded-[2rem] p-6 space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <img
              src={form.profileImage || customer.profileImage || '/placeholder.png'}
              alt={customer.name}
              className="h-24 w-24 rounded-[1.5rem] object-cover border border-[var(--color-border)] bg-white"
            />
            <div className="space-y-2">
              <p className="text-lg font-extrabold">Profile photo</p>
              <label className="soft-button inline-flex cursor-pointer rounded-full px-4 py-2 text-sm font-bold">
                Upload picture
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Full name</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Phone number</span>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none"
              />
            </label>
          </div>

          <label className="block space-y-2 text-sm">
            <span className="font-semibold">Address</span>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none"
            />
          </label>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">Referral code</span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${customer.referralCodeChanged ? 'bg-[#fbe8e6] text-[#a53a2f]' : 'bg-[#eef7ee] text-[var(--color-primary)]'}`}>
                {customer.referralCodeChanged ? 'Already changed once' : 'You can edit this once'}
              </span>
            </div>
            <input
              value={form.referralCode}
              onChange={(e) => setForm({ ...form, referralCode: e.target.value.toUpperCase() })}
              disabled={customer.referralCodeChanged}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 uppercase outline-none disabled:bg-[#f4f2eb]"
            />
          </div>

          <button type="submit" disabled={saving} className="cta-button rounded-2xl px-5 py-3 text-sm font-extrabold">
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </form>

        <div className="space-y-6">
          <div className="surface-card rounded-[2rem] p-6 space-y-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">Current balances</p>
              <h2 className="mt-2 text-2xl font-extrabold">Your shoe and referral balances</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] bg-white p-4 border border-[var(--color-border)]">
                <p className="text-sm text-[#666]">Referral wallet</p>
                <p className="mt-2 text-3xl font-extrabold text-[var(--color-primary)]">Ksh {customer.walletBalance.toLocaleString()}</p>
              </div>
              <div className="rounded-[1.5rem] bg-white p-4 border border-[var(--color-border)]">
                <p className="text-sm text-[#666]">Shoe balance</p>
                <p className={`mt-2 text-3xl font-extrabold ${customer.shoeBalance >= 0 ? 'text-[var(--color-primary)]' : 'text-[var(--color-error)]'}`}>
                  Ksh {customer.shoeBalance.toLocaleString()}
                </p>
              </div>
            </div>

            <button
              onClick={handleWithdraw}
              disabled={withdrawing || customer.walletBalance < 2}
              className="soft-button rounded-2xl px-5 py-3 text-sm font-extrabold disabled:opacity-40"
            >
              {withdrawing ? 'Processing...' : `Withdraw Ksh ${Math.floor(customer.walletBalance / 2)}`}
            </button>
          </div>

          <div className="surface-card rounded-[2rem] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <p className="text-lg font-extrabold">Your referral link</p>
              <button onClick={handleCopy} type="button" className="soft-button rounded-full px-3 py-1.5 text-xs font-bold">
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <input readOnly value={referralLink} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm" />
            <button
              type="button"
              onClick={() => {
                const msg = `Shop shoes in Narok! Use my referral link: ${referralLink}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
              }}
              className="cta-button rounded-2xl px-5 py-3 text-sm font-extrabold"
            >
              Share on WhatsApp
            </button>
          </div>

          <div className="surface-card rounded-[2rem] p-6 space-y-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">Orders and payments</p>
              <h2 className="mt-2 text-2xl font-extrabold">What your account shows</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white p-4">
                <p className="text-sm text-[#666]">Orders placed</p>
                <p className="mt-2 text-3xl font-extrabold">{orders.length}</p>
              </div>
              <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white p-4">
                <p className="text-sm text-[#666]">Payments made</p>
                <p className="mt-2 text-3xl font-extrabold text-[var(--color-primary)]">Ksh {totalPaid.toLocaleString()}</p>
              </div>
              <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white p-4">
                <p className="text-sm text-[#666]">Outstanding credit</p>
                <p className="mt-2 text-3xl font-extrabold text-[#c26b00]">Ksh {outstandingBalance.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="surface-card rounded-[2rem] p-6 space-y-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">Referral activity</p>
              <h2 className="mt-2 text-2xl font-extrabold">People who joined with your link</h2>
              <p className="mt-2 text-sm text-[#666]">You earn Ksh 100 once a referred person places a qualifying purchase above Ksh 999.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white p-4">
                <p className="text-sm text-[#666]">Joined with your link</p>
                <p className="mt-2 text-3xl font-extrabold">{referredCustomers.length}</p>
              </div>
              <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white p-4">
                <p className="text-sm text-[#666]">Qualified bonuses earned</p>
                <p className="mt-2 text-3xl font-extrabold text-[var(--color-primary)]">{qualifiedReferrals.length}</p>
              </div>
            </div>

            {referredCustomers.length ? (
              <div className="space-y-3">
                {referredCustomers.map((referral) => (
                  <div key={referral._id} className="rounded-[1.4rem] border border-[var(--color-border)] bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-extrabold">{referral.name}</p>
                        <p className="text-sm text-[#666]">{referral.phone || referral.email || 'No contact added yet'}</p>
                        <p className="text-xs text-[#7a7a7a]">Joined {new Date(referral.joinedAt).toLocaleString()}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        referral.hasQualifiedPurchase
                          ? 'bg-[#eef7ee] text-[var(--color-primary)]'
                          : 'bg-[#fff4e5] text-[#b86a00]'
                      }`}>
                        {referral.hasQualifiedPurchase ? 'Bonus earned' : 'Waiting for purchase'}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className={`rounded-full px-3 py-1 font-semibold ${
                        referral.profileComplete
                          ? 'bg-[#f4f8ff] text-[#2754a6]'
                          : 'bg-[#f8f1f1] text-[#a53a2f]'
                      }`}>
                        {referral.profileComplete ? 'Profile complete' : 'Profile incomplete'}
                      </span>
                      {referral.bonusAwardedAt && (
                        <span className="rounded-full bg-[#eef7ee] px-3 py-1 font-semibold text-[var(--color-primary)]">
                          Rewarded on {new Date(referral.bonusAwardedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#666]">Nobody has signed up with your referral link yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="surface-card mt-6 rounded-[2rem] p-6">
        <div className="mb-4">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">Balance history</p>
          <h2 className="mt-2 text-2xl font-extrabold">Staff balance updates</h2>
        </div>

        {customer.balanceUpdates?.length ? (
          <div className="space-y-3">
            {customer.balanceUpdates.map((entry) => (
              <div key={entry._id} className="rounded-[1.4rem] border border-[var(--color-border)] bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className={`font-extrabold ${entry.type === 'credit' ? 'text-[var(--color-primary)]' : 'text-[var(--color-error)]'}`}>
                      {entry.type === 'credit' ? '+' : '-'}Ksh {entry.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-[#666]">
                      {entry.updatedBy?.name || 'Staff'} updated your balance to Ksh {entry.newValue.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-xs text-[#777]">{new Date(entry.updatedAt).toLocaleString()}</p>
                </div>
                {entry.note && <p className="mt-2 text-sm text-[#4f4f4f]">{entry.note}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#666]">No balance updates from staff yet.</p>
        )}
      </div>

      <div className="surface-card mt-6 rounded-[2rem] p-6">
        <div className="mb-4">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">My orders</p>
          <h2 className="mt-2 text-2xl font-extrabold">Orders, installments, and remaining balances</h2>
        </div>

        {orders.length ? (
          <div className="space-y-4">
            {orders.map((order) => {
              const remaining = Math.max(order.totalAmount - (order.walletDiscount || 0) - (order.manualDiscount || 0) - (order.paidAmount || 0), 0);

              return (
                <div key={order._id} className="rounded-[1.5rem] border border-[var(--color-border)] bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-extrabold">{order.items.length} item(s)</p>
                      <p className="text-sm text-[#666]">
                        {order.paymentType === 'credit' ? 'Lipa polepole' : 'Full payment'} · {(order.status === 'delivered' && order.paymentType === 'full') ? 'sold' : order.status.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-[#7a7a7a]">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[#666]">Order total</p>
                      <p className="text-2xl font-extrabold">Ksh {order.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-[#f7f6f2] p-4">
                      <p className="text-sm text-[#666]">Paid so far</p>
                      <p className="mt-1 text-xl font-extrabold text-[var(--color-primary)]">Ksh {(order.paidAmount || 0).toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl bg-[#f7f6f2] p-4">
                      <p className="text-sm text-[#666]">Discounts used</p>
                      <p className="mt-1 text-xl font-extrabold">Ksh {((order.walletDiscount || 0) + (order.manualDiscount || 0)).toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl bg-[#f7f6f2] p-4">
                      <p className="text-sm text-[#666]">Still remaining</p>
                      <p className="mt-1 text-xl font-extrabold text-[#c26b00]">Ksh {remaining.toLocaleString()}</p>
                    </div>
                  </div>

                  {order.installments?.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      {order.installments.slice().reverse().map((installment, index) => (
                        <div key={`${order._id}-${index}`} className="rounded-2xl border border-[var(--color-border)] px-4 py-3">
                          <p className="font-bold text-[var(--color-primary)]">Ksh {installment.amount.toLocaleString()}</p>
                          <p className="text-sm text-[#666]">
                            {(installment.paymentMethod || 'cash').toUpperCase()} {installment.reference ? `· ${installment.reference}` : ''} · {new Date(installment.paidAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-[#666]">No installment records yet for this order.</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[#666]">You have not placed any orders yet.</p>
        )}
      </div>

      <div className="surface-card mt-6 rounded-[2rem] p-6">
        <div className="mb-4">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">Special orders</p>
          <h2 className="mt-2 text-2xl font-extrabold">Track requested shoes and required deposit</h2>
        </div>

        {specialOrders.length ? (
          <div className="space-y-4">
            {specialOrders.map((order) => (
              <div key={order._id} className="rounded-[1.5rem] border border-[var(--color-border)] bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-extrabold">{order.productName || order.product?.name || 'Requested shoe'}</p>
                    <p className="text-sm text-[#666]">
                      Size {order.requestedSize || 'Not specified'}{order.requestedColor ? ` · ${order.requestedColor}` : ''}
                    </p>
                    <p className="text-xs text-[#7a7a7a]">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                    order.status === 'fulfilled' ? 'bg-[#eef7ee] text-[var(--color-primary)]' :
                    order.status === 'rejected' ? 'bg-[#f8e8e5] text-[#a53a2f]' :
                    order.status === 'ordered' ? 'bg-[#eef3ff] text-[#2754a6]' :
                    'bg-[#fff4e5] text-[#b86a00]'
                  }`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>

                {order.description && <p className="mt-3 text-sm text-[#4f4f4f]">{order.description}</p>}

                {order.quotedAmount > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-[#f7f6f2] p-4">
                      <p className="text-sm text-[#666]">Shoe amount</p>
                      <p className="mt-1 text-xl font-extrabold">Ksh {order.quotedAmount.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl bg-[#f7f6f2] p-4">
                      <p className="text-sm text-[#666]">Required deposit</p>
                      <p className="mt-1 text-xl font-extrabold text-[#a85d00]">Ksh {order.requiredDeposit.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl bg-[#f7f6f2] p-4">
                      <p className="text-sm text-[#666]">Deposit status</p>
                      <p className="mt-1 text-xl font-extrabold">
                        {order.depositPaid ? 'Paid' : 'Pending'}
                      </p>
                      {order.depositPaid && (
                        <p className="mt-1 text-xs text-[#666]">
                          via {order.depositPaymentMethod} on {new Date(order.depositPaidAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-[#666]">Our team is still reviewing your request and will set the shoe amount first.</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#666]">You have not submitted any special shoe requests yet.</p>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { getMyProfile, updateMyProfile, withdrawWallet } from '../../api/customers.js';
import client from '../../api/client.js';
import useToastStore from '../../store/toastStore.js';

const toDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export default function SettingsPage() {
  const toast = useToastStore((s) => s.show);
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
      })
      .catch(async () => {
        try {
          await client.post('/api/auth/sync', {});
          const profile = await getMyProfile();
          applyProfile(profile);
        } catch {
          toast('Failed to load profile', 'error');
        }
      });
  }, [toast]);

  const referralLink = customer
    ? `${window.location.origin}/signup?ref=${customer.referralCode}`
    : '';

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
      const dataUrl = await toDataUrl(file);
      setForm((current) => ({ ...current, profileImage: dataUrl }));
    } catch {
      toast('Could not read that image', 'error');
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
    </div>
  );
}

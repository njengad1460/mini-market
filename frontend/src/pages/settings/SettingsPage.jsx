import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { withdrawWallet } from '../../api/customers.js';

export default function SettingsPage() {
  const [customer, setCustomer] = useState(null);
  const [copied, setCopied]     = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    client.post('/api/auth/sync').then(r => setCustomer(r.data.customer)).catch(() => {});
  }, []);

  const referralLink = customer
    ? `${window.location.origin}/signup?ref=${customer.referralCode}`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      const result = await withdrawWallet();
      setCustomer({ ...customer, walletBalance: result.remaining });
      alert(`Ksh ${result.withdrawn} withdrawn successfully`);
    } catch (err) {
      alert(err.response?.data?.message || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  if (!customer) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* wallet */}
      <div className="border rounded-xl p-4 space-y-3">
        <p className="font-semibold">Bonus Wallet</p>
        <p className="text-3xl font-bold text-green-600">Ksh {customer.walletBalance}</p>
        <p className="text-xs text-gray-500">
          You can withdraw up to 50% of your balance at a time.
          Earned by referring friends who purchase over Ksh 999.
        </p>
        <button
          onClick={handleWithdraw}
          disabled={withdrawing || customer.walletBalance < 2}
          className="w-full bg-green-600 text-white py-2 rounded-xl text-sm disabled:opacity-40"
        >
          {withdrawing ? 'Processing...' : `Withdraw Ksh ${Math.floor(customer.walletBalance / 2)}`}
        </button>
      </div>

      {/* referral */}
      <div className="border rounded-xl p-4 space-y-3">
        <p className="font-semibold">Your Referral Link</p>
        <p className="text-xs text-gray-500">
          Share this link. Earn Ksh 100 for every friend who purchases over Ksh 999.
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={referralLink}
            className="flex-1 border rounded-xl px-3 py-2 text-sm bg-gray-50"
          />
          <button
            onClick={handleCopy}
            className="bg-black text-white px-4 py-2 rounded-xl text-sm"
          >
            {copied ? '✓' : 'Copy'}
          </button>
        </div>
        <button
          onClick={() => {
            const msg = `Shop shoes in Narok! Use my referral link: ${referralLink}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
          }}
          className="w-full bg-green-500 text-white py-2 rounded-xl text-sm"
        >
          📲 Share via WhatsApp
        </button>
      </div>

      {/* profile info */}
      <div className="border rounded-xl p-4 space-y-1 text-sm">
        <p className="font-semibold mb-2">Profile</p>
        <p><span className="text-gray-500">Name:</span> {customer.name}</p>
        <p><span className="text-gray-500">Phone:</span> {customer.phone}</p>
        <p><span className="text-gray-500">Email:</span> {customer.email}</p>
      </div>
    </div>
  );
}

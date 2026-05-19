import { useEffect, useState } from 'react';
import client from '../../api/client.js';

export default function CashFloatPage() {
  const [session, setSession]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState({ amount: '', method: 'cash', reference: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchSession = () =>
    client.get('/api/cash/active').then(r => { setSession(r.data); setLoading(false); });

  useEffect(() => { fetchSession(); }, []);

  const handleOpen = async () => {
    await client.post('/api/cash/open');
    fetchSession();
  };

  const handleClose = async () => {
    if (!confirm('Close this cash session?')) return;
    await client.post('/api/cash/close');
    setSession(null);
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post('/api/cash/transaction', {
        amount:    Number(form.amount),
        method:    form.method,
        reference: form.reference,
      });
      setForm({ amount: '', method: 'cash', reference: '' });
      fetchSession();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record transaction');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-4 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Cash Session</h1>

      {!session ? (
        <div className="border rounded-xl p-6 text-center space-y-3">
          <p className="text-gray-500">No active session</p>
          <button
            onClick={handleOpen}
            className="bg-black text-white px-6 py-2 rounded-xl"
          >
            Open Session
          </button>
        </div>
      ) : (
        <>
          {/* session summary */}
          <div className="border rounded-xl p-4 space-y-1">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">Session Active</p>
                <p className="text-sm text-gray-500">
                  Opened: {new Date(session.openedAt).toLocaleTimeString()}
                </p>
              </div>
              <p className="text-xl font-bold text-green-600">
                Ksh {session.totalCollected}
              </p>
            </div>
          </div>

          {/* record transaction */}
          <form onSubmit={handleTransaction} className="border rounded-xl p-4 space-y-3">
            <p className="font-semibold">Record Payment</p>
            <input
              type="number"
              placeholder="Amount (Ksh)"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full border rounded-xl px-4 py-2"
              required
            />
            <div className="flex gap-2">
              {['cash', 'mpesa'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm({ ...form, method: m })}
                  className={`flex-1 py-2 rounded-xl border capitalize text-sm ${
                    form.method === m ? 'bg-black text-white' : ''
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            {form.method === 'mpesa' && (
              <input
                placeholder="M-Pesa reference"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                className="w-full border rounded-xl px-4 py-2"
              />
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 text-white py-2 rounded-xl"
            >
              {submitting ? 'Recording...' : 'Record Payment'}
            </button>
          </form>

          {/* transactions list */}
          <div className="border rounded-xl p-4">
            <p className="font-semibold mb-3">Transactions ({session.transactions.length})</p>
            {session.transactions.length === 0 && (
              <p className="text-sm text-gray-400">No transactions yet</p>
            )}
            {session.transactions.map((t, i) => (
              <div key={i} className="flex justify-between text-sm py-2 border-b last:border-0">
                <span className="capitalize">{t.method} {t.reference && `· ${t.reference}`}</span>
                <span className="font-semibold">Ksh {t.amount}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleClose}
            className="w-full border border-red-500 text-red-500 py-3 rounded-xl"
          >
            Close Session
          </button>
        </>
      )}
    </div>
  );
}

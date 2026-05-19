import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCustomers, registerWalkin } from '../../api/customers.js';
import CustomerSearch from '../../features/customers/CustomerSearch.jsx';
import CustomerProfile from '../../features/customers/CustomerProfile.jsx';
import { useToastStore } from '../../components/Toast.jsx';

// Customer detail view
export function CustomerDetailPage() {
  const { id } = useParams();
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <CustomerProfile customerId={id} />
    </div>
  );
}

// Main customers list page
export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ name: '', phone: '', address: '' });
  const [coords, setCoords]       = useState(null);
  const [locating, setLocating]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const toast                     = useToastStore((s) => s.show);

  useEffect(() => { getCustomers().then(setCustomers); }, []);

  const pinLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords([pos.coords.longitude, pos.coords.latitude]); setLocating(false); },
      () => { toast('Could not get location', 'error'); setLocating(false); }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coords) return toast('Please pin the customer location first', 'error');
    setLoading(true);
    try {
      const customer = await registerWalkin({ ...form, coordinates: coords });
      setCustomers([customer, ...customers]);
      setShowForm(false);
      setForm({ name: '', phone: '', address: '' });
      setCoords(null);
      toast('Customer registered ✓');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to register', 'error');
    } finally {
      setLoading(false);
    }
  };

  // summary
  const walkin     = customers.filter(c => c.registrationType === 'walkin').length;
  const registered = customers.filter(c => c.registrationType === 'registered').length;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Customers</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-black text-white px-4 py-2 rounded-xl text-sm"
        >
          + Walk-in
        </button>
      </div>

      {/* stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">{customers.length}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{registered}</p>
          <p className="text-xs text-gray-500">Registered</p>
        </div>
        <div className="border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">{walkin}</p>
          <p className="text-xs text-gray-500">Walk-in</p>
        </div>
      </div>

      {/* walk-in form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-xl p-4 mb-6 space-y-3">
          <p className="font-semibold">Register Walk-in Customer</p>
          <input
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border rounded-xl px-4 py-2 text-sm"
            required
          />
          <input
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border rounded-xl px-4 py-2 text-sm"
            required
          />
          <input
            placeholder="Area / Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full border rounded-xl px-4 py-2 text-sm"
          />
          <button
            type="button"
            onClick={pinLocation}
            className={`w-full border py-2 rounded-xl text-sm ${
              coords ? 'border-green-500 text-green-600' : 'border-blue-500 text-blue-500'
            }`}
          >
            {locating ? 'Getting location...' : coords ? '✓ Location Pinned' : '📍 Pin Location'}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-xl text-sm"
          >
            {loading ? 'Registering...' : 'Register Customer'}
          </button>
        </form>
      )}

      {/* search */}
      <CustomerSearch />

      {/* list */}
      <div className="space-y-2">
        {customers.map((c) => (
          <a
            key={c._id}
            href={`/dashboard/customers/${c._id}`}
            className="flex justify-between items-center border rounded-xl p-4 hover:bg-gray-50"
          >
            <div>
              <p className="font-semibold">{c.name}</p>
              <p className="text-sm text-gray-500">{c.phone}</p>
              {c.location?.address && (
                <p className="text-xs text-gray-400">📍 {c.location.address}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                c.registrationType === 'walkin'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {c.registrationType}
              </span>
              {c.registeredBy && (
                <p className="text-xs text-gray-400">by {c.registeredBy.name}</p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

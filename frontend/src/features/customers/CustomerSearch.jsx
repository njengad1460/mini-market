import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomers } from '../../api/customers.js';

export default function CustomerSearch() {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate              = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const all = await getCustomers();
      const q   = query.toLowerCase();
      setResults(all.filter(c =>
        c.name.toLowerCase().includes(q) || c.phone.includes(q)
      ));
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          placeholder="Search by name or phone..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 border rounded-xl px-4 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded-xl text-sm"
        >
          {loading ? '...' : 'Search'}
        </button>
      </form>

      {searched && results.length === 0 && (
        <p className="text-sm text-gray-400 mt-3 text-center">No customers found</p>
      )}

      {results.length > 0 && (
        <div className="mt-3 border rounded-xl overflow-hidden">
          {results.map((c) => (
            <div
              key={c._id}
              onClick={() => navigate(`/dashboard/customers/${c._id}`)}
              className="flex justify-between items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
            >
              <div>
                <p className="font-medium text-sm">{c.name}</p>
                <p className="text-xs text-gray-500">{c.phone}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                c.registrationType === 'walkin'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {c.registrationType}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { useToastStore } from '../../components/Toast.jsx';
import InventoryTable from '../../features/inventory/InventoryTable.jsx';
import LowStockAlert from '../../features/inventory/LowStockAlert.jsx';

export default function InventoryPage() {
  const toast                 = useToastStore((s) => s.show);
  const [shoes, setShoes]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState({ name: '', brand: '', price: '', costPrice: '', category: '' });
  const [saving, setSaving]   = useState(false);

  const fetchShoes = () =>
    client.get('/api/products/admin').then(r => { setShoes(r.data); setLoading(false); });

  useEffect(() => { fetchShoes(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/api/products', {
        ...form,
        price:     Number(form.price),
        costPrice: Number(form.costPrice),
        sizes:     [],
      });
      toast('Product added ✓');
      fetchShoes();
      setShowForm(false);
      setForm({ name: '', brand: '', price: '', costPrice: '', category: '' });
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to add product', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading inventory...</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-black text-white px-4 py-2 rounded-xl text-sm"
        >
          + Add Shoe
        </button>
      </div>

      <LowStockAlert shoes={shoes} />

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-xl p-4 mb-6 space-y-3">
          <p className="font-semibold">New Product</p>
          {['name', 'brand', 'category'].map((f) => (
            <input
              key={f}
              placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
              value={form[f]}
              onChange={(e) => setForm({ ...form, [f]: e.target.value })}
              className="w-full border rounded-xl px-4 py-2 text-sm"
              required={f === 'name'}
            />
          ))}
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Selling Price (Ksh)"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="border rounded-xl px-4 py-2 text-sm"
              required
            />
            <input
              type="number"
              placeholder="Cost Price (Ksh)"
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
              className="border rounded-xl px-4 py-2 text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-black text-white py-2 rounded-xl text-sm"
          >
            {saving ? 'Saving...' : 'Save Product'}
          </button>
        </form>
      )}

      <InventoryTable shoes={shoes} onRefresh={fetchShoes} />
    </div>
  );
}

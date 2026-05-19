import { useState } from 'react';
import client from '../../api/client.js';
import useAuthStore from '../../store/authStore.js';
import { useToastStore } from '../../components/Toast.jsx';

export default function InventoryTable({ shoes, onRefresh }) {
  const { role }          = useAuthStore();
  const toast             = useToastStore((s) => s.show);
  const [search, setSearch] = useState('');
  const [editStock, setEditStock] = useState(null); // { shoeId, sizeIndex, value }

  const filtered = shoes.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const handleStockSave = async (shoeId, sizes) => {
    try {
      await client.patch(`/api/products/${shoeId}`, { sizes });
      toast('Stock updated ✓');
      onRefresh();
      setEditStock(null);
    } catch {
      toast('Failed to update stock', 'error');
    }
  };

  return (
    <div>
      <input
        placeholder="Search by name or brand..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border rounded-xl px-4 py-2 mb-4 text-sm"
      />

      <div className="space-y-3">
        {filtered.map((shoe) => (
          <div key={shoe._id} className="border rounded-xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold">{shoe.name}</p>
                {shoe.brand && <p className="text-xs text-gray-400">{shoe.brand}</p>}
                <p className="text-green-600 font-medium text-sm">Ksh {shoe.price.toLocaleString()}</p>
                {role === 'admin' && (
                  <p className="text-xs text-gray-400">Cost: Ksh {shoe.costPrice?.toLocaleString()}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  shoe.status === 'active'  ? 'bg-green-100 text-green-700' :
                  shoe.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {shoe.status}
                </span>
                {role === 'admin' && shoe.status === 'pending' && (
                  <button
                    onClick={async () => {
                      await client.patch(`/api/products/${shoe._id}/approve`);
                      toast('Product approved ✓');
                      onRefresh();
                    }}
                    className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg"
                  >
                    Approve
                  </button>
                )}
              </div>
            </div>

            {/* sizes + stock */}
            <div className="flex flex-wrap gap-2">
              {shoe.sizes?.map((s, i) => (
                <div
                  key={s.size}
                  className={`border rounded-lg px-3 py-1.5 text-sm text-center min-w-[60px] ${
                    s.stock === 0 ? 'bg-red-50 border-red-200' :
                    s.stock <= 3  ? 'bg-yellow-50 border-yellow-200' :
                    'bg-green-50 border-green-200'
                  }`}
                >
                  <p className="font-medium">{s.size}</p>
                  {editStock?.shoeId === shoe._id && editStock?.sizeIndex === i ? (
                    <input
                      type="number"
                      className="w-12 border rounded text-center text-xs"
                      value={editStock.value}
                      onChange={(e) => setEditStock({ ...editStock, value: e.target.value })}
                      onBlur={() => {
                        const updated = shoe.sizes.map((sz, idx) =>
                          idx === i ? { ...sz, stock: Number(editStock.value) } : sz
                        );
                        handleStockSave(shoe._id, updated);
                      }}
                      autoFocus
                    />
                  ) : (
                    <p
                      className="text-xs cursor-pointer"
                      onClick={() => setEditStock({ shoeId: shoe._id, sizeIndex: i, value: s.stock })}
                    >
                      {s.stock} pcs
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8">No products found</p>
        )}
      </div>
    </div>
  );
}

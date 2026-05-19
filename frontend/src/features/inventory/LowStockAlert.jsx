export default function LowStockAlert({ shoes, threshold = 3 }) {
  const lowStock = shoes.filter(s =>
    s.sizes?.some(sz => sz.stock > 0 && sz.stock <= threshold)
  );

  if (lowStock.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
      <p className="font-semibold text-red-700 mb-2">⚠️ Low Stock Alert ({lowStock.length})</p>
      <div className="space-y-1">
        {lowStock.map((shoe) => {
          const low = shoe.sizes.filter(s => s.stock > 0 && s.stock <= threshold);
          return (
            <div key={shoe._id} className="flex justify-between text-sm">
              <span className="text-red-700">{shoe.name}</span>
              <span className="text-red-500">
                {low.map(s => `Size ${s.size}: ${s.stock} left`).join(' · ')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

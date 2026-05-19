import useI18n from '../../i18n/index.js';

export default function ProductFilters({ filters, onChange, shoes }) {
  const t = useI18n((s) => s.t);

  const categories = ['', ...new Set(shoes.map(s => s.category).filter(Boolean))];
  const sizes      = ['', ...new Set(shoes.flatMap(s => s.sizes.map(sz => sz.size)))].sort();

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <input
        type="text"
        placeholder={t('catalog.search')}
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        className="border rounded-xl px-4 py-2 text-sm flex-1 min-w-[160px]"
      />
      <select
        value={filters.category}
        onChange={(e) => onChange({ ...filters, category: e.target.value })}
        className="border rounded-xl px-3 py-2 text-sm"
      >
        <option value="">{t('catalog.allCategories')}</option>
        {categories.filter(Boolean).map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select
        value={filters.size}
        onChange={(e) => onChange({ ...filters, size: e.target.value })}
        className="border rounded-xl px-3 py-2 text-sm"
      >
        <option value="">{t('catalog.allSizes')}</option>
        {sizes.filter(Boolean).map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <input
        type="number"
        placeholder={t('catalog.filterPrice')}
        value={filters.maxPrice}
        onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
        className="border rounded-xl px-3 py-2 text-sm w-32"
      />
    </div>
  );
}

import useI18n from '../../i18n/index.js';

export default function ProductFilters({ filters, onChange, shoes }) {
  const t = useI18n((s) => s.t);

  const categories = ['', ...new Set(shoes.map(s => s.category).filter(Boolean))];
  const sizes      = ['', ...new Set(shoes.flatMap(s => s.sizes.map(sz => sz.size)))].sort();

  return (
    <div className="surface-card rounded-[2rem] p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[var(--color-primary)]">{t('catalog.filterTitle')}</p>
          <p className="text-xs text-[#6a6a6a]">{t('catalog.filterHint')}</p>
        </div>
        <button
          onClick={() => onChange({ search: '', category: '', size: '', maxPrice: '' })}
          className="soft-button rounded-full px-4 py-2 text-xs font-bold"
        >
          {t('catalog.clearFilters')}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <input
          type="text"
          placeholder={t('catalog.search')}
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
        />
        <select
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
          className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
        >
          <option value="">{t('catalog.allCategories')}</option>
          {categories.filter(Boolean).map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filters.size}
          onChange={(e) => onChange({ ...filters, size: e.target.value })}
          className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
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
          className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
        />
      </div>
    </div>
  );
}

import { useState } from 'react';
import useI18n from '../../i18n/index.js';

export default function ProductFilters({ filters, onChange, shoes = [] }) {
  const t = useI18n((s) => s.t);
  const [isOpen, setIsOpen] = useState(false);

  const safeShoes = Array.isArray(shoes) ? shoes : [];
  const categories = ['', ...new Set(safeShoes.map(s => s.category).filter(Boolean))];
  const sizes      = ['', ...new Set(safeShoes.flatMap(s => (s.sizes || []).map(sz => sz.size)))].sort();
  const hasActiveFilters = Boolean(filters.search || filters.category || filters.size || filters.maxPrice);

  return (
    <div className="mb-2">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden flex w-full items-center justify-between rounded-[1.5rem] border border-[var(--color-border)] bg-white px-5 py-3.5 font-extrabold text-[var(--color-text)] shadow-[var(--shadow-soft)] transition hover:border-[var(--color-primary)]"
      >
        <span className="flex items-center gap-2">
          <svg className="h-5 w-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {t('catalog.filterTitle') || 'Filters'}
        </span>
        <div className="flex items-center gap-2">
          {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent)]"></span>}
          <svg className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      <div className={`surface-card rounded-[2rem] p-4 sm:p-5 mt-3 md:mt-0 ${isOpen ? 'block' : 'hidden md:block'}`}>
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
    </div>
  );
}

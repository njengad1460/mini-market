import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../../api/shoe.js';
import useCartStore from '../../store/cartStore.js';
import useI18n from '../../i18n/index.js';
import { useToastStore } from '../../components/Toast.jsx';
import { ShoeCardSkeleton } from '../../components/Skeleton.jsx';
import ProductFilters from '../../features/products/ProductFilters.jsx';

export default function Catalog() {
  const [shoes, setShoes]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', category: '', size: '', maxPrice: '' });
  const addItem  = useCartStore((s) => s.addItem);
  const t        = useI18n((s) => s.t);
  const lang     = useI18n((s) => s.lang);
  const setLang  = useI18n((s) => s.setLang);
  const toast    = useToastStore((s) => s.show);

  useEffect(() => {
    getProducts().then(setShoes).finally(() => setLoading(false));
  }, []);

  const handleAdd = async (shoe) => {
    const firstAvailable = shoe.sizes?.find(s => s.stock > 0)?.size;
    if (!firstAvailable) return toast('No sizes available', 'error');
    await addItem(shoe._id, firstAvailable);
    toast(t('product.added'));
  };

  const filtered = shoes.filter((shoe) => {
    if (filters.search   && !shoe.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.category && shoe.category !== filters.category) return false;
    if (filters.size     && !shoe.sizes?.some(s => s.size === filters.size && s.stock > 0)) return false;
    if (filters.maxPrice && shoe.price > Number(filters.maxPrice)) return false;
    return true;
  });

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* header + language toggle */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{t('catalog.title')}</h1>
        <button
          onClick={() => setLang(lang === 'en' ? 'sw' : 'en')}
          className="text-sm border rounded-xl px-3 py-1.5"
        >
          {lang === 'en' ? '🇰🇪 Kiswahili' : '🇬🇧 English'}
        </button>
      </div>

      <ProductFilters filters={filters} onChange={setFilters} shoes={shoes} />

      {/* grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <ShoeCardSkeleton key={i} />)
          : filtered.map((shoe) => (
            <div key={shoe._id} className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <Link to={`/shoes/${shoe._id}`}>
                <img
                  src={shoe.images?.[0] || '/placeholder.png'}
                  alt={shoe.name}
                  className="w-full h-48 object-cover"
                />
              </Link>
              <div className="p-3">
                <Link to={`/shoes/${shoe._id}`} className="font-semibold hover:underline line-clamp-1">
                  {shoe.name}
                </Link>
                {shoe.brand && <p className="text-xs text-gray-400">{shoe.brand}</p>}
                <p className="text-green-600 font-bold mt-1">Ksh {shoe.price.toLocaleString()}</p>
                <button
                  onClick={() => handleAdd(shoe)}
                  className="mt-2 w-full bg-black text-white py-1.5 rounded-lg text-sm hover:bg-gray-800 transition-colors"
                >
                  {t('catalog.addToCart')}
                </button>
              </div>
            </div>
          ))
        }
      </div>

      {/* empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">👟</p>
          <p className="text-gray-500">{t('catalog.empty')}</p>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../../api/shoe.js';
import useCartStore from '../../store/cartStore.js';
import useI18n from '../../i18n/index.js';
import useToastStore from '../../store/toastStore.js';
import { ShoeCardSkeleton } from '../../components/Skeleton.jsx';
import ProductFilters from '../../features/products/ProductFilters.jsx';

export default function Catalog() {
  const productsPerPage = 8;
  const [shoes, setShoes]     = useState([]);
  const [randomShoes, setRandomShoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', category: '', size: '', maxPrice: '' });
  const [activeSlide, setActiveSlide] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const addItem  = useCartStore((s) => s.addItem);
  const t        = useI18n((s) => s.t);
  const toast    = useToastStore((s) => s.show);

  useEffect(() => {
    getProducts().then((res) => {
      setShoes(res);
      setRandomShoes([...res].sort(() => 0.5 - Math.random()).slice(0, 4));
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (shoes.length === 0) return undefined;

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % Math.min(Math.max(shoes.length, 3), 4));
    }, 4200);

    return () => window.clearInterval(interval);
  }, [shoes]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.category, filters.size, filters.maxPrice]);

  const handleAdd = async (shoe) => {
    const firstAvailable = shoe.sizes?.find(s => s.stock > 0)?.size;
    if (!firstAvailable) return toast('No sizes available', 'error');
    try {
      await addItem(shoe._id, firstAvailable);
      toast(t('product.added'));
    } catch {
      toast(t('common.error'), 'error');
    }
  };

  const filtered = shoes.filter((shoe) => {
    if (filters.search   && !shoe.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.category && shoe.category !== filters.category) return false;
    if (filters.size     && !shoe.sizes?.some(s => s.size === filters.size && s.stock > 0)) return false;
    if (filters.maxPrice && shoe.price > Number(filters.maxPrice)) return false;
    return true;
  }).sort((a, b) => {
    const aStock = a.sizes?.reduce((sum, s) => sum + (s.stock > 0 ? s.stock : 0), 0) || 0;
    const bStock = b.sizes?.reduce((sum, s) => sum + (s.stock > 0 ? s.stock : 0), 0) || 0;
    const aOut = aStock === 0 ? 1 : 0;
    const bOut = bStock === 0 ? 1 : 0;
    return aOut - bOut;
  });

  const spotlight = randomShoes.slice(0, 2).map((shoe, index) => ({
    id: shoe._id,
    title: shoe.name,
    subtitle: index === 0 ? t('catalog.heroFresh') : t('catalog.heroComfort'),
    text: `${shoe.brand || t('catalog.heroBrandless')} · Ksh ${shoe.price.toLocaleString()}`,
    image: shoe.images?.[0] || '/placeholder.png',
    to: `/shoes/${shoe._id}`,
  }));

  const slides = [
    ...spotlight,
    {
      id: 'offer-lipa',
      title: t('catalog.heroLipaTitle'),
      subtitle: t('catalog.heroOffer'),
      text: t('catalog.heroLipaText'),
      image: randomShoes[2]?.images?.[0] || spotlight[0]?.image || '/placeholder.png',
      to: '/checkout',
    },
    {
      id: 'offer-delivery',
      title: t('catalog.heroDeliveryTitle'),
      subtitle: t('catalog.heroFast'),
      text: t('catalog.heroDeliveryText'),
      image: randomShoes[3]?.images?.[0] || spotlight[1]?.image || '/placeholder.png',
      to: '/request-shoe',
    },
  ];

  // Provide defaults if randomShoes is empty during loading
  const currentSlide = slides[activeSlide % slides.length] || { title: '', subtitle: '', text: '', image: '/placeholder.png', to: '#' };
  const topCategories = [...new Set(shoes.map((shoe) => shoe.category).filter(Boolean))].slice(0, 5);
  const totalPages = Math.max(1, Math.ceil(filtered.length / productsPerPage));
  const featuredShoes = filtered.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);
  const budgetShoes = filtered.filter((shoe) => shoe.price <= 2500).slice(0, 4);
  const quickStats = [
    t('catalog.statDelivery'),
    t('catalog.statInstallment'),
    t('catalog.statSupport'),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="mb-6">
        <div className="relative overflow-hidden rounded-[2rem] p-4 sm:p-6 max-w-5xl mx-auto shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(46,125,50,0.94)] via-[rgba(46,125,50,0.88)] to-[rgba(102,187,106,0.85)]" />
          <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_55%)]" />
          <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="max-w-xl text-white">
              <span className="inline-flex rounded-full bg-white/18 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-white/95">
                {currentSlide.subtitle}
              </span>
              <h1 className="mt-4 text-2xl font-extrabold leading-tight sm:text-4xl">
                {currentSlide.title}
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-white/88 sm:text-base">
                {currentSlide.text}
              </p>
              <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
                <Link to={currentSlide.to} className="rounded-full bg-white px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold text-[#2e7d32] transition hover:bg-[#f7f4eb] shadow-lg">
                  {t('catalog.shopCollection') || 'Shop Collection'}
                </Link>
                <Link to="/request-shoe" className="rounded-full border border-white/20 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white transition hover:bg-white/10">
                  {t('catalog.requestPair') || 'Request a Pair'}
                </Link>
              </div>
            </div>

            <div className="relative mx-auto flex w-full max-w-sm justify-center mt-6 lg:mt-0">
              <div className="absolute -bottom-4 h-20 w-40 rounded-full bg-black/15 blur-3xl" />
              <img
                src={currentSlide.image}
                alt={currentSlide.title}
                className="relative h-[180px] w-full rounded-[1.5rem] object-cover shadow-[0_16px_40px_rgba(0,0,0,0.18)] sm:h-[240px]"
              />
            </div>
          </div>

          <div className="relative mt-5 flex flex-wrap items-center gap-3">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setActiveSlide(index)}
                className={`h-2.5 rounded-full transition ${index === activeSlide ? 'w-8 bg-white' : 'w-2.5 bg-white/45'}`}
                aria-label={`${t('catalog.slide')} ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mb-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-text-muted)]">{t('catalog.title')}</p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-[var(--color-text)]">{t('catalog.marketTitle')}</h2>
        </div>
      </section>

      <section className="mb-6 flex overflow-x-auto pb-2 scrollbar-hide gap-2" style={{ WebkitOverflowScrolling: 'touch' }}>
        {topCategories.map((category) => (
          <button
            key={category}
            onClick={() => setFilters({ ...filters, category })}
            className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition ${
              filters.category === category
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-white text-[#4b4b4b] border border-[var(--color-border)]'
            }`}
          >
            {category}
          </button>
        ))}
      </section>

      <ProductFilters filters={filters} onChange={setFilters} shoes={shoes} />

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-2xl font-extrabold">{t('catalog.featured')}</h3>
            <p className="text-sm text-[#666]">{t('catalog.featuredHint')}</p>
          </div>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[var(--color-primary)] shadow-[var(--shadow-soft)]">
            {filtered.length} {t('catalog.results')}
          </span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ShoeCardSkeleton key={i} />)
            : featuredShoes.map((shoe) => {
              const availableSizes = shoe.sizes?.filter((size) => size.stock > 0) || [];
              const totalStock = availableSizes.reduce((sum, item) => sum + item.stock, 0);
              const isOutOfStock = totalStock === 0;

              return (
                <article key={shoe._id} className="surface-card overflow-hidden rounded-[1.75rem] transition hover:-translate-y-1 hover:shadow-[var(--shadow-card)]">
                  <Link to={`/shoes/${shoe._id}`} className="relative block overflow-hidden rounded-t-[1.5rem]">
                    <img
                      src={shoe.images?.[0] || '/placeholder.png'}
                      alt={shoe.name}
                      className="h-56 w-full object-cover transition duration-500 hover:scale-105"
                    />
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      {shoe.category && (
                        <span className="rounded-full bg-white/92 px-3 py-1 text-xs font-bold text-[#1f1f1f]">
                          {shoe.category}
                        </span>
                      )}
                      {totalStock <= 3 && totalStock > 0 && (
                        <span className="accent-badge rounded-full px-3 py-1 text-xs font-bold">
                          {t('catalog.lowStock')}
                        </span>
                      )}
                      {isOutOfStock && (
                        <span className="rounded-full bg-[#f8e8e5] px-3 py-1 text-xs font-bold text-[#a53a2f]">
                          Out of stock
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="p-4">
                    <Link to={`/shoes/${shoe._id}`} className="line-clamp-1 text-lg font-extrabold hover:text-[var(--color-primary)]">
                      {shoe.name}
                    </Link>
                    <p className="mt-1 line-clamp-1 text-sm text-[#6b6b6b]">
                      {shoe.brand || t('catalog.heroBrandless')}
                    </p>
                    <p className="mt-3 text-2xl font-extrabold text-[var(--color-primary)]">
                      Ksh {shoe.price.toLocaleString()}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {availableSizes.slice(0, 4).map((size) => (
                        <span key={size.size} className="rounded-full bg-[#eef7ee] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
                          {size.size}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Link
                        to={`/shoes/${shoe._id}`}
                        className="flex-1 rounded-2xl border border-[var(--color-border)] px-4 py-3 text-center text-sm font-bold transition hover:border-[var(--color-primary)]"
                      >
                        {t('catalog.viewDetails')}
                      </Link>
                      {isOutOfStock ? (
                        <Link
                          to={`/request-shoe?productId=${shoe._id}&productName=${encodeURIComponent(shoe.name)}`}
                          className="flex-1 rounded-2xl border border-[#c26b00] bg-[#fff4e5] px-4 py-3 text-center text-sm font-extrabold text-[#9a5500] transition hover:bg-[#ffe7bf]"
                        >
                          Request order
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleAdd(shoe)}
                          className="cta-button flex-1 rounded-2xl px-4 py-3 text-sm font-extrabold transition"
                        >
                          {t('catalog.addToCart')}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          }
        </div>

        {!loading && filtered.length > productsPerPage && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-bold text-[var(--color-text)] transition disabled:cursor-not-allowed disabled:opacity-45"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1;
              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`h-10 min-w-10 rounded-full px-3 text-sm font-extrabold transition ${
                    page === currentPage
                      ? 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-soft)]'
                      : 'border border-[var(--color-border)] bg-white text-[var(--color-text)]'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-bold text-[var(--color-text)] transition disabled:cursor-not-allowed disabled:opacity-45"
            >
              Next
            </button>
          </div>
        )}
      </section>

      {!loading && budgetShoes.length > 0 && (
        <section className="mt-10">
          <div className="mb-4">
            <h3 className="text-2xl font-extrabold">{t('catalog.affordable')}</h3>
            <p className="text-sm text-[#666]">{t('catalog.affordableHint')}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {budgetShoes.map((shoe) => (
              <Link key={shoe._id} to={`/shoes/${shoe._id}`} className="surface-card flex items-center gap-4 rounded-[1.5rem] p-4 transition hover:-translate-y-1 hover:shadow-[var(--shadow-card)]">
                <img
                  src={shoe.images?.[0] || '/placeholder.png'}
                  alt={shoe.name}
                  className="h-24 w-24 rounded-[1.2rem] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 font-extrabold">{shoe.name}</p>
                  <p className="mt-1 text-sm text-[#6a6a6a]">{shoe.brand || t('catalog.heroBrandless')}</p>
                  <p className="mt-2 text-lg font-extrabold text-[var(--color-primary)]">Ksh {shoe.price.toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!loading && filtered.length === 0 && (
        <div className="surface-card mt-8 rounded-[2rem] px-6 py-14 text-center">
          <p className="text-2xl font-extrabold">{t('catalog.empty')}</p>
          <p className="mt-2 text-sm text-[#666]">{t('catalog.emptyHint')}</p>
        </div>
      )}

      {/* Quick stats moved to bottom */}
      <section className="mt-16 mb-8">
        <h3 className="text-2xl font-extrabold text-center mb-6 text-[#212121]">{t('catalog.whyUs')}</h3>
        <div className="grid gap-6 sm:grid-cols-3">
          {quickStats.map((stat) => (
            <div key={stat} className="surface-card rounded-[1.5rem] p-6 text-center hover:shadow-[var(--shadow-hover)] transition hover:-translate-y-1">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff5e6] text-[var(--color-accent)] mb-5">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[15px] font-bold text-[var(--color-text)]">{stat}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

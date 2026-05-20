import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../../api/shoe.js';
import useCartStore from '../../store/cartStore.js';
import useI18n from '../../i18n/index.js';
import useToastStore from '../../store/toastStore.js';
import { ShoeCardSkeleton } from '../../components/Skeleton.jsx';
import ProductFilters from '../../features/products/ProductFilters.jsx';

export default function Catalog() {
  const [shoes, setShoes]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', category: '', size: '', maxPrice: '' });
  const [activeSlide, setActiveSlide] = useState(0);
  const addItem  = useCartStore((s) => s.addItem);
  const t        = useI18n((s) => s.t);
  const lang     = useI18n((s) => s.lang);
  const setLang  = useI18n((s) => s.setLang);
  const toast    = useToastStore((s) => s.show);

  useEffect(() => {
    getProducts().then(setShoes).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (shoes.length === 0) return undefined;

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % Math.min(Math.max(shoes.length, 3), 4));
    }, 4200);

    return () => window.clearInterval(interval);
  }, [shoes]);

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
  });

  const spotlight = shoes.slice(0, 2).map((shoe, index) => ({
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
      image: spotlight[0]?.image || '/placeholder.png',
      to: '/checkout',
    },
    {
      id: 'offer-delivery',
      title: t('catalog.heroDeliveryTitle'),
      subtitle: t('catalog.heroFast'),
      text: t('catalog.heroDeliveryText'),
      image: spotlight[1]?.image || spotlight[0]?.image || '/placeholder.png',
      to: '/request-shoe',
    },
  ];

  const currentSlide = slides[activeSlide % slides.length];
  const topCategories = [...new Set(shoes.map((shoe) => shoe.category).filter(Boolean))].slice(0, 5);
  const featuredShoes = filtered.slice(0, 8);
  const budgetShoes = filtered.filter((shoe) => shoe.price <= 2500).slice(0, 4);
  const quickStats = [
    t('catalog.statDelivery'),
    t('catalog.statInstallment'),
    t('catalog.statSupport'),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="mb-6 grid gap-4 lg:grid-cols-[1.45fr_0.55fr]">
        <div className="surface-card relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(46,125,50,0.94)] via-[rgba(46,125,50,0.88)] to-[rgba(102,187,106,0.85)]" />
          <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_55%)]" />
          <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="max-w-xl text-white">
              <span className="inline-flex rounded-full bg-white/18 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-white/95">
                {currentSlide.subtitle}
              </span>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">
                {currentSlide.title}
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-white/88 sm:text-base">
                {currentSlide.text}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to={currentSlide.to} className="rounded-full bg-white px-5 py-3 text-sm font-extrabold text-[var(--color-primary)] transition hover:bg-[#f7f4eb]">
                  {t('catalog.shopCollection')}
                </Link>
                <Link to="/request-shoe" className="rounded-full border border-white/35 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                  {t('catalog.requestPair')}
                </Link>
              </div>
            </div>

            <div className="relative mx-auto flex w-full max-w-md justify-center">
              <div className="absolute -bottom-8 h-28 w-52 rounded-full bg-black/15 blur-3xl" />
              <img
                src={currentSlide.image}
                alt={currentSlide.title}
                className="relative h-[250px] w-full rounded-[1.75rem] object-cover shadow-[0_24px_60px_rgba(0,0,0,0.18)] sm:h-[320px]"
              />
            </div>
          </div>

          <div className="relative mt-6 flex flex-wrap items-center gap-3">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setActiveSlide(index)}
                className={`h-2.5 rounded-full transition ${index === activeSlide ? 'w-10 bg-white' : 'w-2.5 bg-white/45'}`}
                aria-label={`${t('catalog.slide')} ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {quickStats.map((stat) => (
            <div key={stat} className="surface-card rounded-[1.75rem] p-5">
              <span className="accent-badge inline-flex rounded-full px-3 py-1 text-xs font-bold">
                {t('catalog.whyUs')}
              </span>
              <p className="mt-3 text-base font-extrabold">{stat}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">{t('catalog.title')}</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight">{t('catalog.marketTitle')}</h2>
        </div>
        <button
          onClick={() => setLang(lang === 'en' ? 'sw' : 'en')}
          className="soft-button rounded-full px-4 py-2 text-sm font-bold"
        >
          {lang === 'en' ? 'Kiswahili' : 'English'}
        </button>
      </section>

      <section className="mb-6 flex flex-wrap gap-2">
        {topCategories.map((category) => (
          <button
            key={category}
            onClick={() => setFilters({ ...filters, category })}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
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

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ShoeCardSkeleton key={i} />)
            : featuredShoes.map((shoe) => {
              const availableSizes = shoe.sizes?.filter((size) => size.stock > 0) || [];
              const totalStock = availableSizes.reduce((sum, item) => sum + item.stock, 0);
              const isOutOfStock = totalStock === 0;

              return (
                <article key={shoe._id} className="surface-card overflow-hidden rounded-[1.75rem] transition hover:-translate-y-1 hover:shadow-[var(--shadow-card)]">
                  <Link to={`/shoes/${shoe._id}`} className="relative block">
                    <img
                      src={shoe.images?.[0] || '/placeholder.png'}
                      alt={shoe.name}
                      className="h-56 w-full object-cover"
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
    </div>
  );
}

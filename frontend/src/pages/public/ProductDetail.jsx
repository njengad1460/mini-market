import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProduct } from '../../api/shoe.js';
import useCartStore from '../../store/cartStore.js';
import useI18n from '../../i18n/index.js';
import useToastStore from '../../store/toastStore.js';

export default function ProductDetail() {
  const { id }                = useParams();
  const [shoe, setShoe]       = useState(null);
  const [size, setSize]       = useState('');
  const [imgIndex, setImgIndex] = useState(0);
  const addItem               = useCartStore((s) => s.addItem);
  const t                     = useI18n((s) => s.t);
  const toast                 = useToastStore((s) => s.show);

  useEffect(() => {
    getProduct(id).then((data) => {
      setShoe(data);
      setSize(data.sizes?.find(s => s.stock > 0)?.size || '');
    });
  }, [id]);

  if (!shoe)
    return (
      <div className="mx-auto max-w-6xl animate-pulse space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <div className="h-80 w-full rounded-[2rem] bg-[#e9efe4]" />
        <div className="h-7 w-1/2 rounded bg-[#e9efe4]" />
        <div className="h-4 w-1/4 rounded bg-[#edf3e8]" />
      </div>
    );

  const images = shoe.images?.length ? shoe.images : ['/placeholder.png'];

  const handleAdd = async () => {
    await addItem(shoe._id, size);
    toast(t('product.added'));
  };

  const handleShare = () => {
    const msg = `Check out ${shoe.name} for Ksh ${shoe.price} on Narok Shoes! ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="surface-card rounded-[2rem] p-4 sm:p-5">
          <img
            src={images[imgIndex]}
            alt={shoe.name}
            className="h-80 w-full rounded-[1.5rem] object-cover sm:h-[460px]"
          />
          {images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  onClick={() => setImgIndex(i)}
                  className={`h-20 w-20 cursor-pointer rounded-2xl object-cover border-2 transition ${
                    imgIndex === i ? 'border-[var(--color-primary)]' : 'border-transparent'
                  }`}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="surface-card rounded-[2rem] p-6 sm:p-7">
            {shoe.category && (
              <span className="soft-button inline-flex rounded-full px-3 py-1 text-xs font-bold">
                {shoe.category}
              </span>
            )}
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{shoe.name}</h1>
            <p className="mt-2 text-sm text-[#666]">{shoe.brand || t('catalog.heroBrandless')}</p>
            <p className="mt-5 text-3xl font-extrabold text-[var(--color-primary)]">
              Ksh {shoe.price.toLocaleString()}
            </p>

            <div className="mt-6">
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                {t('product.selectSize')}
              </p>
              <div className="flex flex-wrap gap-2">
                {shoe.sizes?.map((s) => (
                  <button
                    key={s.size}
                    onClick={() => s.stock > 0 && setSize(s.size)}
                    disabled={s.stock === 0}
                    className={`rounded-2xl border px-4 py-2.5 text-sm font-bold transition ${
                      size === s.size
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                        : 'border-[var(--color-border)] bg-white text-[#333]'
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {s.size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
              <button
                onClick={handleAdd}
                disabled={!size}
                className="cta-button rounded-2xl px-5 py-4 text-sm font-extrabold disabled:opacity-40"
              >
                {t('catalog.addToCart')}
              </button>
              <button
                onClick={handleShare}
                className="rounded-2xl border border-[var(--color-border)] bg-white px-5 py-4 text-sm font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary)]"
              >
                {t('product.share')}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="surface-card rounded-[1.75rem] p-5">
              <span className="accent-badge inline-flex rounded-full px-3 py-1 text-xs font-bold">
                {t('product.deliveryBadge')}
              </span>
              <p className="mt-3 text-base font-extrabold">{t('product.deliveryTitle')}</p>
              <p className="mt-2 text-sm leading-6 text-[#666]">{t('product.deliveryDesc')}</p>
            </div>
            <div className="surface-card rounded-[1.75rem] p-5">
              <span className="soft-button inline-flex rounded-full px-3 py-1 text-xs font-bold">
                {t('product.lipaBadge')}
              </span>
              <p className="mt-3 text-base font-extrabold">{t('product.lipaTitle')}</p>
              <p className="mt-2 text-sm leading-6 text-[#666]">{t('product.lipaDesc')}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

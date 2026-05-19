import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProduct } from '../../api/shoe.js';
import useCartStore from '../../store/cartStore.js';
import useI18n from '../../i18n/index.js';
import { useToastStore } from '../../components/Toast.jsx';

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
      <div className="p-4 max-w-2xl mx-auto animate-pulse space-y-4">
        <div className="w-full h-72 bg-gray-200 rounded-xl" />
        <div className="h-6 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/4" />
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
    <div className="p-4 max-w-2xl mx-auto">
      {/* image gallery */}
      <div className="relative">
        <img
          src={images[imgIndex]}
          alt={shoe.name}
          className="w-full h-72 object-cover rounded-xl mb-2"
        />
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt=""
                onClick={() => setImgIndex(i)}
                className={`w-16 h-16 object-cover rounded-lg cursor-pointer flex-shrink-0 border-2 ${
                  imgIndex === i ? 'border-black' : 'border-transparent'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <h1 className="text-2xl font-bold mt-3">{shoe.name}</h1>
      {shoe.brand    && <p className="text-gray-500">{shoe.brand}</p>}
      {shoe.category && <p className="text-xs text-gray-400">{shoe.category}</p>}
      <p className="text-green-600 text-xl font-bold mt-2">Ksh {shoe.price.toLocaleString()}</p>

      {/* size selector */}
      <div className="mt-4">
        <p className="font-medium mb-2">{t('product.selectSize')}</p>
        <div className="flex gap-2 flex-wrap">
          {shoe.sizes?.map((s) => (
            <button
              key={s.size}
              onClick={() => s.stock > 0 && setSize(s.size)}
              disabled={s.stock === 0}
              className={`px-3 py-1.5 border rounded-lg text-sm relative ${
                size === s.size ? 'bg-black text-white' : 'bg-white'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {s.size}
              {s.stock === 0 && (
                <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center">×</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleAdd}
          disabled={!size}
          className="flex-1 bg-black text-white py-3 rounded-xl font-semibold disabled:opacity-40"
        >
          {t('catalog.addToCart')}
        </button>
        <button
          onClick={handleShare}
          className="border px-4 py-3 rounded-xl text-green-600 font-semibold"
        >
          📲
        </button>
      </div>

      {/* lipa pole pole */}
      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm">
        <p className="font-semibold text-yellow-800">💳 {t('product.lipaTitle')}</p>
        <p className="text-yellow-700 mt-1">{t('product.lipaDesc')}</p>
      </div>
    </div>
  );
}

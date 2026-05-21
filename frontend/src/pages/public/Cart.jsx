import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useCartStore from '../../store/cartStore.js';
import useAuthStore from '../../store/authStore.js';
import useI18n from '../../i18n/index.js';
import useToastStore from '../../store/toastStore.js';
import { ListItemSkeleton } from '../../components/Skeleton.jsx';

export default function Cart() {
  const { items, fetchCart, removeItem, total, whatsappCheckout } = useCartStore();
  const { user }      = useAuthStore();
  const t             = useI18n((s) => s.t);
  const toast         = useToastStore((s) => s.show);
  const [guestPhone, setGuestPhone] = useState('');
  const [loading, setLoading]       = useState(true);
  const [removing, setRemoving]     = useState(null);

  useEffect(() => {
    fetchCart().finally(() => setLoading(false));
  }, [fetchCart]);

  const handleRemove = async (shoeId, size) => {
    setRemoving(`${shoeId}-${size}`);
    await removeItem(shoeId, size);
    toast(t('cart.remove') + ' ✓', 'info');
    setRemoving(null);
  };

  const handleWhatsapp = async () => {
    if (!guestPhone) return;
    await whatsappCheckout(guestPhone);
  };

  if (loading)
    return (
      <div className="p-4 max-w-xl mx-auto space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <ListItemSkeleton key={i} />)}
      </div>
    );

  if (items.length === 0)
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-5xl">🛒</p>
        <p className="text-gray-500 text-lg">{t('cart.empty')}</p>
        <Link to="/" className="inline-block bg-black text-white px-6 py-2 rounded-xl">
          {t('cart.browse')}
        </Link>
      </div>
    );

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{t('cart.title')}</h1>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={`${item.shoe._id}-${item.size}`}
            className={`flex gap-3 border rounded-xl p-3 transition-opacity ${
              removing === `${item.shoe._id}-${item.size}` ? 'opacity-40' : ''
            }`}
          >
            <img
              src={item.shoe.images?.[0] || '/placeholder.png'}
              alt={item.shoe.name}
              onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.png'; }}
              className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-gray-100 border border-gray-200"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{item.shoe.name}</p>
              <p className="text-sm text-gray-500">
                {t('product.selectSize')}: {item.size} · x{item.quantity}
              </p>
              <p className="text-green-600 font-bold">
                Ksh {(item.shoe.price * item.quantity).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => handleRemove(item.shoe._id, item.size)}
              className="text-red-400 text-sm self-start flex-shrink-0"
            >
              {t('cart.remove')}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t pt-4 flex justify-between items-center">
        <p className="text-gray-500">{t('cart.total')}</p>
        <p className="text-xl font-bold">Ksh {total().toLocaleString()}</p>
      </div>

      {/* guest WhatsApp checkout */}
      {!user && (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-gray-600">{t('cart.phoneLabel')}</p>
          <input
            type="tel"
            placeholder={t('cart.phonePlaceholder')}
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
          />
          <button
            onClick={handleWhatsapp}
            disabled={!guestPhone}
            className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
          >
            📲 {t('cart.orderViaWhatsapp')}
          </button>
          <div className="flex items-center gap-2">
            <hr className="flex-1" />
            <span className="text-gray-400 text-sm">{t('cart.orLogin')}</span>
            <hr className="flex-1" />
          </div>
          <Link
            to="/login"
            className="block text-center border border-black py-3 rounded-xl font-semibold"
          >
            {t('auth.login')}
          </Link>
        </div>
      )}

      {user && (
        <Link
          to="/checkout"
          className="mt-6 block text-center bg-black text-white py-3 rounded-xl font-semibold"
        >
          {t('cart.proceedCheckout')}
        </Link>
      )}
    </div>
  );
}

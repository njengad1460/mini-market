import { create } from 'zustand';
import * as cartApi from '../api/cart.js';

const useCartStore = create((set, get) => ({
  items:   [],
  loading: false,
  error:   null,

  fetchCart: async () => {
    set({ loading: true, error: null });
    try {
      const cart = await cartApi.getCart();
      set({ items: cart.items || [], loading: false });
    } catch (err) {
      set({ loading: false, error: err.message });
    }
  },

  addItem: async (shoeId, size, quantity = 1) => {
    if (!shoeId || !size) return;
    try {
      await cartApi.addToCart({ shoeId, size, quantity });
      await get().fetchCart();
    } catch (err) {
      console.error('Add to cart failed:', err.response?.data?.message || err.message);
      throw err;
    }
  },

  removeItem: async (shoeId, size) => {
    try {
      await cartApi.removeFromCart({ shoeId, size });
      await get().fetchCart();
    } catch (err) {
      console.error('Remove from cart failed:', err.message);
      throw err;
    }
  },

  total: () =>
    get().items.reduce((sum, i) => sum + (i.shoe?.price || 0) * i.quantity, 0),

  whatsappCheckout: async (guestPhone) => {
    const businessPhone = import.meta.env.VITE_BUSINESS_WHATSAPP_PHONE;
    const { waLink } = await cartApi.whatsappCheckout({ businessPhone, guestPhone });
    window.open(waLink, '_blank');
  },
}));

export default useCartStore;

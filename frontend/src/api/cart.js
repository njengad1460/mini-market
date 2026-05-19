import client from './client.js';

export const getCart            = ()      => client.get('/api/cart').then(r => r.data);
export const addToCart          = (data)  => client.post('/api/cart/add', data).then(r => r.data);
export const removeFromCart     = (data)  => client.post('/api/cart/remove', data).then(r => r.data);
export const whatsappCheckout   = (data)  => client.post('/api/cart/whatsapp-checkout', data).then(r => r.data);

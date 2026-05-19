import client from './client.js';

export const getProducts  = ()     => client.get('/api/products').then(r => r.data);
export const getProduct   = (id)   => client.get(`/api/products/${id}`).then(r => r.data);

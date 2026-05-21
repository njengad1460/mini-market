import client from './client.js';

export const getMySpecialOrders = () => client.get('/api/special-orders/my').then(r => r.data);
export const getSpecialOrders = () => client.get('/api/special-orders').then(r => r.data);
export const createSpecialOrder = (data) => client.post('/api/special-orders', data).then(r => r.data);
export const updateSpecialOrderStatus = (id, data) => client.patch(`/api/special-orders/${id}`, data).then(r => r.data);

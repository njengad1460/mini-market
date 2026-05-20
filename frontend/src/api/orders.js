import client from './client.js';

export const getOrders       = ()            => client.get('/api/orders').then(r => r.data);
export const getMyOrders     = ()            => client.get('/api/orders/my').then(r => r.data);
export const placeOrder      = (data)        => client.post('/api/orders', data).then(r => r.data);
export const payInstallment  = (id, data)    => client.post(`/api/orders/${id}/installment`, data).then(r => r.data);
export const completeOrder   = (id, data)    => client.post(`/api/orders/${id}/complete`, data).then(r => r.data);
export const recordDelivery  = (id, data)    => client.post(`/api/orders/${id}/delivery`, data).then(r => r.data);
export const applyDiscount   = (id, data)    => client.patch(`/api/orders/${id}/discount`, data).then(r => r.data);

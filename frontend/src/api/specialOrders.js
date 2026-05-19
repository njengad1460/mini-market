import client from './client.js';

export const getSpecialOrders        = ()           => client.get('/api/special-orders').then(r => r.data);
export const updateSpecialOrderStatus = (id, status) => client.patch(`/api/special-orders/${id}`, { status }).then(r => r.data);

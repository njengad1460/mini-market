import client from './client.js';

export const getCustomers    = ()       => client.get('/api/customers').then(r => r.data);
export const getCustomer     = (id)     => client.get(`/api/customers/${id}`).then(r => r.data);
export const registerWalkin  = (data)   => client.post('/api/customers/walkin', data).then(r => r.data);
export const withdrawWallet  = ()       => client.post('/api/customers/wallet/withdraw').then(r => r.data);

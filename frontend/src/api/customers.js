import client from './client.js';

export const getCustomers    = ()       => client.get('/api/customers').then(r => r.data);
export const getCustomer     = (id)     => client.get(`/api/customers/${id}`).then(r => r.data);
export const getMyProfile    = ()       => client.get('/api/customers/me').then(r => r.data);
export const updateMyProfile = (data)   => client.patch('/api/customers/me', data).then(r => r.data);
export const uploadProfileImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return client.post('/api/customers/me/profile-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data);
};
export const registerWalkin  = (data)   => client.post('/api/customers/walkin', data).then(r => r.data);
export const updateCustomerBalance = (id, data) => client.patch(`/api/customers/${id}/balance`, data).then(r => r.data);
export const withdrawWallet  = ()       => client.post('/api/customers/wallet/withdraw').then(r => r.data);

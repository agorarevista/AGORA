import api from './axios';

export const getDashboard = () => api.get('/admin/dashboard').then(r => r.data);
export const getSiteConfig = () => api.get('/admin/config').then(r => r.data);
export const updateSiteConfig = (data) => api.put('/admin/config', data).then(r => r.data);
export const getUsers = () => api.get('/admin/users').then(r => r.data);
export const createUser = (data) => api.post('/admin/users', data).then(r => r.data);
export const updateUser = (id, data) => api.put(`/admin/users/${id}`, data).then(r => r.data);
export const toggleUser = (id) => api.patch(`/admin/users/${id}/toggle`).then(r => r.data);
export const uploadFile = (file, folder) => {
  const form = new FormData();
  form.append('file', file);
  return api.post(`/upload?folder=${folder}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data);
};
import api from './axios';

// Público
export const getSponsors = () =>
  api.get('/sponsors').then(r => r.data);

// Admin
export const getAllSponsors = () =>
  api.get('/sponsors/all').then(r => r.data);

export const getSponsor = (id) =>
  api.get(`/sponsors/${id}`).then(r => r.data);

export const createSponsor = (payload) =>
  api.post('/sponsors', payload).then(r => r.data);

export const updateSponsor = (id, payload) =>
  api.put(`/sponsors/${id}`, payload).then(r => r.data);

export const deleteSponsor = (id) =>
  api.delete(`/sponsors/${id}`).then(r => r.data);
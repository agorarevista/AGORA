import api from './axios';

export const getConvocatorias = () => api.get('/convocatorias').then(r => r.data);
export const getActiveConvocatorias = () => api.get('/convocatorias/active').then(r => r.data);
export const getConvocatoria = (id) => api.get(`/convocatorias/${id}`).then(r => r.data);
export const createConvocatoria = (data) => api.post('/convocatorias', data).then(r => r.data);
export const updateConvocatoria = (id, data) => api.put(`/convocatorias/${id}`, data).then(r => r.data);
export const submitToConvocatoria = (data) => api.post('/submissions', data).then(r => r.data);
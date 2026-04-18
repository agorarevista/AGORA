import api from './axios';

export const getEditions = () => api.get('/editions').then(r => r.data);

export const getCurrentEdition = async () => {
  const editions = await getEditions();
  return (editions || []).find(ed => ed.is_current) || null;
};

export const getEdition = (number) => api.get(`/editions/${number}`).then(r => r.data);
export const createEdition = (data) => api.post('/editions', data).then(r => r.data);
export const updateEdition = (id, data) => api.put(`/editions/${id}`, data).then(r => r.data);
export const setCurrentEdition = (id) => api.patch(`/editions/${id}/set-current`).then(r => r.data);
import api from './axios';

export const getCollaborators    = ()         => api.get('/collaborators').then(r => r.data);
export const searchCollaborators = (q)        => api.get('/collaborators', { params: { q } }).then(r => r.data);
export const getCollaborator     = (slug)     => api.get(`/collaborators/${slug}`).then(r => r.data);
export const getCollaboratorBySlug = (slug)   => api.get(`/collaborators/${slug}`).then(r => r.data);
export const createCollaborator  = (data)     => api.post('/collaborators', data).then(r => r.data);
export const updateCollaborator  = (id, data) => api.put(`/collaborators/${id}`, data).then(r => r.data);
export const deleteCollaborator  = (id)       => api.delete(`/collaborators/${id}`).then(r => r.data);
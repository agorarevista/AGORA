import api from './axios';

export const createSubmission  = (data)        => api.post('/submissions', data).then(r => r.data);
export const getSubmissions    = (params)       => api.get('/submissions', { params }).then(r => r.data);
export const updateSubmission  = (id, data)     => api.put(`/submissions/${id}`, data).then(r => r.data);
export const deleteSubmission  = (id)           => api.delete(`/submissions/${id}`).then(r => r.data);
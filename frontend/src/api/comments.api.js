import api from './axios';

export const getComments = (article_id) => api.get(`/comments/article/${article_id}`).then(r => r.data);
export const getAllComments = (params) => api.get('/comments', { params }).then(r => r.data);
export const createComment = (data) => api.post('/comments', data).then(r => r.data);
export const updateCommentStatus = (id, status) => api.patch(`/comments/${id}/status`, { status }).then(r => r.data);
export const deleteComment = (id) => api.delete(`/comments/${id}`).then(r => r.data);
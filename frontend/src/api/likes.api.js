import api from './axios';

export const getLikes = (article_id) => api.get(`/likes/${article_id}`).then(r => r.data);
export const toggleLike = (article_id) => api.post(`/likes/${article_id}/toggle`).then(r => r.data);
export const checkLike = (article_id) => api.get(`/likes/${article_id}/check`).then(r => r.data);
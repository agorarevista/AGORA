import api from './axios';

export const getHome = () => api.get('/articles/home').then(r => r.data);
export const getArticles = (params) => api.get('/articles', { params }).then(r => r.data);
export const getArticle = (slug) => api.get(`/articles/${slug}`).then(r => r.data);
export const getArticleById = (id) => api.get(`/articles/by-id/${id}`).then(r => r.data);
export const getFeatured = () => api.get('/articles/featured').then(r => r.data);
export const searchArticles = (q, params) => api.get('/articles/search', { params: { q, ...params } }).then(r => r.data);
export const getByCategory = (slug, params) => api.get(`/articles/category/${slug}`, { params }).then(r => r.data);
export const getByCollaborator = (slug, params) => api.get(`/articles/collaborator/${slug}`, { params }).then(r => r.data);
export const getByEdition = (number, params) => api.get(`/articles/edition/${number}`, { params }).then(r => r.data);
export const createArticle = (data) => api.post('/articles', data).then(r => r.data);
export const updateArticle = (id, data) => api.put(`/articles/${id}`, data).then(r => r.data);
export const publishArticle = (id) => api.patch(`/articles/${id}/publish`).then(r => r.data);
export const deleteArticle = (id) => api.delete(`/articles/${id}`).then(r => r.data);
import api from './axios';

/**
 * Categorías públicas:
 * solo devuelve categorías activas y visibles en la navbar.
 */
export const getCategories = () =>
  api.get('/categories').then(response => response.data);

/**
 * Categorías para el panel administrativo:
 * devuelve padres, hijas, activas e inactivas.
 */
export const getAdminCategories = () =>
  api.get('/categories/admin/all').then(response => response.data);

/**
 * Obtiene todas las columnas fijas públicas.
 */
export const getColumns = () =>
  api.get('/categories/columns').then(response => response.data);

/**
 * Obtiene una categoría pública por slug.
 */
export const getCategory = slug =>
  api.get(`/categories/${slug}`).then(response => response.data);

/**
 * Crea una categoría padre o hija.
 */
export const createCategory = data =>
  api.post('/categories', data).then(response => response.data);

/**
 * Actualiza una categoría.
 */
export const updateCategory = (id, data) =>
  api.put(`/categories/${id}`, data).then(response => response.data);

/**
 * Despublica una categoría desde el backend.
 */
export const deleteCategory = id =>
  api.delete(`/categories/${id}`).then(response => response.data);
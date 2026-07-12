import api from './axios';

/**
 * Todas las convocatorias para el panel administrativo.
 */
export const getConvocatorias = () =>
  api
    .get('/convocatorias')
    .then(response => response.data);

/**
 * Convocatorias activas visibles al público.
 */
export const getActiveConvocatorias = () =>
  api
    .get('/convocatorias/active')
    .then(response => response.data);

/**
 * Obtiene una convocatoria por ID.
 */
export const getConvocatoria = id =>
  api
    .get(`/convocatorias/${id}`)
    .then(response => response.data);

/**
 * Crea una convocatoria.
 */
export const createConvocatoria = data =>
  api
    .post('/convocatorias', data)
    .then(response => response.data);

/**
 * Actualiza una convocatoria.
 */
export const updateConvocatoria = (
  id,
  data
) =>
  api
    .put(`/convocatorias/${id}`, data)
    .then(response => response.data);

/**
 * Abre inmediatamente una convocatoria.
 */
export const openConvocatoria = id =>
  api
    .patch(`/convocatorias/${id}/open`)
    .then(response => response.data);

/**
 * Cierra una convocatoria sin eliminarla.
 */
export const closeConvocatoria = id =>
  api
    .patch(`/convocatorias/${id}/close`)
    .then(response => response.data);

/**
 * Elimina definitivamente una convocatoria.
 */
export const deleteConvocatoria = id =>
  api
    .delete(`/convocatorias/${id}`)
    .then(response => response.data);

/**
 * Envía una participación a una convocatoria.
 *
 * Se conserva porque ConvocatoriaPage.jsx la importa
 * para el formulario público de envíos.
 */
export const submitToConvocatoria = (
  convocatoriaId,
  data
) =>
  api
    .post(
      `/submissions/convocatoria/${convocatoriaId}`,
      data
    )
    .then(response => response.data);
import api from './axios';

export const getConvocatorias =
  () =>
    api
      .get('/convocatorias')
      .then(
        response =>
          response.data
      );

export const getActiveConvocatorias =
  () =>
    api
      .get(
        '/convocatorias/active'
      )
      .then(
        response =>
          response.data
      );

export const getConvocatoria =
  id =>
    api
      .get(
        `/convocatorias/${id}`
      )
      .then(
        response =>
          response.data
      );

export const createConvocatoria =
  data =>
    api
      .post(
        '/convocatorias',
        data
      )
      .then(
        response =>
          response.data
      );

export const updateConvocatoria =
  (
    id,
    data
  ) =>
    api
      .put(
        `/convocatorias/${id}`,
        data
      )
      .then(
        response =>
          response.data
      );

export const openConvocatoria =
  id =>
    api
      .patch(
        `/convocatorias/${id}/open`
      )
      .then(
        response =>
          response.data
      );

export const closeConvocatoria =
  id =>
    api
      .patch(
        `/convocatorias/${id}/close`
      )
      .then(
        response =>
          response.data
      );

export const deleteConvocatoria =
  id =>
    api
      .delete(
        `/convocatorias/${id}`
      )
      .then(
        response =>
          response.data
      );
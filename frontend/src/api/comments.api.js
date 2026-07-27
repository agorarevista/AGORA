import api from './axios';

export const getComments = (
  contentType,
  contentId
) => {
  return api
    .get(
      `/comments/content/${contentType}/${contentId}`
    )
    .then(
      response =>
        response.data
    );
};

export const getAllComments = params => {
  return api
    .get(
      '/comments',
      {
        params,
      }
    )
    .then(
      response =>
        response.data
    );
};

export const createComment = data => {
  return api
    .post(
      '/comments',
      data
    )
    .then(
      response =>
        response.data
    );
};

export const updateCommentStatus = (
  id,
  status
) => {
  return api
    .patch(
      `/comments/${id}/status`,
      {
        status,
      }
    )
    .then(
      response =>
        response.data
    );
};

export const deleteComment = id => {
  return api
    .delete(
      `/comments/${id}`
    )
    .then(
      response =>
        response.data
    );
};
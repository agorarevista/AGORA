import api from './axios';

export const registerShare = (
  contentType,
  contentId,
  platform
) => {
  return api
    .post(
      `/shares/${contentType}/${contentId}`,
      {
        platform,
      }
    )
    .then(
      response =>
        response.data
    );
};

export const getShares = (
  contentType,
  contentId
) => {
  return api
    .get(
      `/shares/${contentType}/${contentId}`
    )
    .then(
      response =>
        response.data
    );
};
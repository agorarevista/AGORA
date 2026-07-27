import api from './axios';

const buildHeaders = options => {
  const visitorId =
    options?.visitorId;

  if (!visitorId) {
    return {};
  }

  return {
    'x-visitor-id':
      visitorId,
  };
};

export const getLikes = (
  contentType,
  contentId,
  options = {}
) => {
  return api
    .get(
      `/likes/${contentType}/${contentId}`,
      {
        headers:
          buildHeaders(
            options
          ),
      }
    )
    .then(
      response =>
        response.data
    );
};

export const toggleLike = (
  contentType,
  contentId,
  options = {}
) => {
  return api
    .post(
      `/likes/${contentType}/${contentId}/toggle`,
      {},
      {
        headers:
          buildHeaders(
            options
          ),
      }
    )
    .then(
      response =>
        response.data
    );
};

export const checkLike = (
  contentType,
  contentId,
  options = {}
) => {
  return api
    .get(
      `/likes/${contentType}/${contentId}/check`,
      {
        headers:
          buildHeaders(
            options
          ),
      }
    )
    .then(
      response =>
        response.data
    );
};
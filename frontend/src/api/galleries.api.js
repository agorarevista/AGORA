import api from './axios';

export const getGalleries = (
  params = {}
) => {
  return api
    .get(
      '/galleries',
      {
        params,
      }
    )
    .then(
      response =>
        response.data
    );
};

export const getAdminGalleries = (
  params = {}
) => {
  return api
    .get(
      '/galleries/admin/all',
      {
        params,
      }
    )
    .then(
      response =>
        response.data
    );
};

export const getGallery = slug => {
  return api
    .get(
      `/galleries/${slug}`
    )
    .then(
      response =>
        response.data
    );
};

export const getGalleryById =
  id => {
    return api
      .get(
        `/galleries/by-id/${id}`
      )
      .then(
        response =>
          response.data
      );
  };

export const createGallery =
  data => {
    return api
      .post(
        '/galleries',
        data
      )
      .then(
        response =>
          response.data
      );
  };

export const updateGallery = (
  id,
  data
) => {
  return api
    .put(
      `/galleries/${id}`,
      data
    )
    .then(
      response =>
        response.data
    );
};

export const publishGallery =
  id => {
    return api
      .patch(
        `/galleries/${id}/publish`
      )
      .then(
        response =>
          response.data
      );
  };

export const archiveGallery =
  id => {
    return api
      .patch(
        `/galleries/${id}/archive`
      )
      .then(
        response =>
          response.data
      );
  };

export const deleteGalleryPermanently =
  id => {
    return api
      .delete(
        `/galleries/${id}/permanent`
      )
      .then(
        response =>
          response.data
      );
  };

  export const getGalleriesByCollaborator =
  (
    slug,
    params = {}
  ) => {
    return api
      .get(
        `/galleries/collaborator/${slug}`,
        {
          params,
        }
      )
      .then(
        response =>
          response.data
      );
  };

export const getGalleriesByEdition =
  (
    number,
    params = {}
  ) => {
    return api
      .get(
        `/galleries/edition/${number}`,
        {
          params,
        }
      )
      .then(
        response =>
          response.data
      );
  };

export const getFeaturedGalleries =
  () => {
    return api
      .get(
        '/galleries/featured'
      )
      .then(
        response =>
          response.data
      );
  };

  export const searchGalleries = (
  query,
  params = {}
) => {
  return api
    .get(
      '/galleries/search',
      {
        params: {
          q: query,
          ...params,
        },
      }
    )
    .then(
      response =>
        response.data
    );
};
import api from './axios';

export const getHome = () =>
  api
    .get('/articles/home')
    .then(
      response =>
        response.data
    );

export const getArticles = (
  params = {}
) =>
  api
    .get(
      '/articles',
      {
        params,
      }
    )
    .then(
      response =>
        response.data
    );

export const getArticle =
  slug =>
    api
      .get(
        `/articles/${slug}`
      )
      .then(
        response =>
          response.data
      );

export const getArticleById =
  id =>
    api
      .get(
        `/articles/by-id/${id}`
      )
      .then(
        response =>
          response.data
      );

export const getFeatured =
  () =>
    api
      .get(
        '/articles/featured'
      )
      .then(
        response =>
          response.data
      );

export const searchArticles = (
  query,
  params = {}
) =>
  api
    .get(
      '/articles/search',
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

export const getByCategory = (
  slug,
  params = {}
) =>
  api
    .get(
      `/articles/category/${slug}`,
      {
        params,
      }
    )
    .then(
      response =>
        response.data
    );

export const getByCollaborator = (
  slug,
  params = {}
) =>
  api
    .get(
      `/articles/collaborator/${slug}`,
      {
        params,
      }
    )
    .then(
      response =>
        response.data
    );

export const getByEdition = (
  number,
  params = {}
) =>
  api
    .get(
      `/articles/edition/${number}`,
      {
        params,
      }
    )
    .then(
      response =>
        response.data
    );

export const createArticle =
  data =>
    api
      .post(
        '/articles',
        data
      )
      .then(
        response =>
          response.data
      );

export const updateArticle = (
  id,
  data
) =>
  api
    .put(
      `/articles/${id}`,
      data
    )
    .then(
      response =>
        response.data
    );

export const updateArticleSeo = (
  id,
  data
) =>
  updateArticle(
    id,
    {
      seo_title:
        data.seo_title ||
        null,

      seo_description:
        data.seo_description ||
        null,

      social_title:
        data.social_title ||
        null,

      social_description:
        data.social_description ||
        null,

      social_image_url:
        data.social_image_url ||
        null,
    }
  );

export const publishArticle =
  id =>
    api
      .patch(
        `/articles/${id}/publish`
      )
      .then(
        response =>
          response.data
      );

export const deleteArticle =
  id =>
    api
      .delete(
        `/articles/${id}`
      )
      .then(
        response =>
          response.data
      );
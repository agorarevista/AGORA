const fs =
  require('fs/promises');

const {
  getArticleSeoBySlug,
  getGallerySeoBySlug,
  getCategorySeoBySlug,
  getCollaboratorSeoBySlug,
  getEditionSeoByNumber,
} = require('./seo.service');

const {
  buildArticleMetadata,
  buildGalleryMetadata,
  buildCategoryMetadata,
  buildCollaboratorMetadata,
  buildEditionMetadata,
  injectSeoIntoHtml,
} = require('./seo.utils');

const readFrontendHtml =
  async frontendIndexPath => {
    return fs.readFile(
      frontendIndexPath,
      'utf8'
    );
  };

const sendReactHtml = (
  res,
  html
) => {
  res.set({
    'Content-Type':
      'text/html; charset=utf-8',

    /*
     * Evita conservar durante demasiado tiempo
     * el HTML SEO después de editar un artículo.
     */
    'Cache-Control':
      'public, max-age=0, s-maxage=300',
  });

  return res
    .status(200)
    .send(html);
  };

const createSeoController =
  frontendIndexPath => {
    const renderArticle =
      async (
        req,
        res,
        next
      ) => {
        try {
          const article =
            await getArticleSeoBySlug(
              req.params.slug
            );

          /*
           * Si no existe, dejamos que React abra
           * su flujo normal y muestre el estado 404.
           */
          if (!article) {
            return next();
          }

          const html =
            await readFrontendHtml(
              frontendIndexPath
            );

          const metadata =
            buildArticleMetadata(
              article
            );

          const result =
            injectSeoIntoHtml(
              html,
              metadata
            );

          return sendReactHtml(
            res,
            result
          );
        } catch (error) {
          return next(error);
        }
      };

    const renderGallery =
      async (
        req,
        res,
        next
      ) => {
        try {
          const gallery =
            await getGallerySeoBySlug(
              req.params.slug
            );

          if (!gallery) {
            return next();
          }

          const html =
            await readFrontendHtml(
              frontendIndexPath
            );

          const metadata =
            buildGalleryMetadata(
              gallery
            );

          const result =
            injectSeoIntoHtml(
              html,
              metadata
            );

          return sendReactHtml(
            res,
            result
          );
        } catch (error) {
          return next(error);
        }
      };

    const renderCategory =
      async (
        req,
        res,
        next
      ) => {
        try {
          const category =
            await getCategorySeoBySlug(
              req.params.slug
            );

          if (!category) {
            return next();
          }

          const html =
            await readFrontendHtml(
              frontendIndexPath
            );

          const metadata =
            buildCategoryMetadata(
              category
            );

          const result =
            injectSeoIntoHtml(
              html,
              metadata
            );

          return sendReactHtml(
            res,
            result
          );
        } catch (error) {
          return next(error);
        }
      };

    const renderCollaborator =
      async (
        req,
        res,
        next
      ) => {
        try {
          const collaborator =
            await getCollaboratorSeoBySlug(
              req.params.slug
            );

          if (!collaborator) {
            return next();
          }

          const html =
            await readFrontendHtml(
              frontendIndexPath
            );

          const metadata =
            buildCollaboratorMetadata(
              collaborator
            );

          const result =
            injectSeoIntoHtml(
              html,
              metadata
            );

          return sendReactHtml(
            res,
            result
          );
        } catch (error) {
          return next(error);
        }
      };

    const renderEdition =
      async (
        req,
        res,
        next
      ) => {
        try {
          const edition =
            await getEditionSeoByNumber(
              req.params.number
            );

          if (!edition) {
            return next();
          }

          const html =
            await readFrontendHtml(
              frontendIndexPath
            );

          const metadata =
            buildEditionMetadata(
              edition
            );

          const result =
            injectSeoIntoHtml(
              html,
              metadata
            );

          return sendReactHtml(
            res,
            result
          );
        } catch (error) {
          return next(error);
        }
      };

    return {
      renderArticle,
      renderGallery,
      renderCategory,
      renderCollaborator,
      renderEdition,
    };
  };

module.exports = {
  createSeoController,
};
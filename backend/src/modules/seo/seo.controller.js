const fs =
  require('fs/promises');

const {
  getArticleSeoBySlug,
  getGallerySeoBySlug,
} = require('./seo.service');

const {
  buildArticleMetadata,
  buildGalleryMetadata,
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

    return {
      renderArticle,
      renderGallery,
    };
  };

module.exports = {
  createSeoController,
};
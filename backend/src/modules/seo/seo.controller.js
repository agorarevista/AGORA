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
  buildStaticPageMetadata,
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
  html,
  statusCode = 200,
  robotsDirective =
    'index, follow'
) => {
  res.set({
    'Content-Type':
      'text/html; charset=utf-8',

 
    'Cache-Control':
      'public, max-age=0, s-maxage=300',
 
    'X-Robots-Tag':
      robotsDirective,
  });

  return res
    .status(statusCode)
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

 
          if (!article) {
            const html =
              await readFrontendHtml(
                frontendIndexPath
              );

            return sendReactHtml(
              res,
              html,
              404,
              'noindex, follow'
            );
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
            const html =
              await readFrontendHtml(
                frontendIndexPath
              );

            return sendReactHtml(
              res,
              html,
              404,
              'noindex, follow'
            );
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
            const html =
              await readFrontendHtml(
                frontendIndexPath
              );

            return sendReactHtml(
              res,
              html,
              404,
              'noindex, follow'
            );
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
            const html =
              await readFrontendHtml(
                frontendIndexPath
              );

            return sendReactHtml(
              res,
              html,
              404,
              'noindex, follow'
            );
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
            const html =
              await readFrontendHtml(
                frontendIndexPath
              );

            return sendReactHtml(
              res,
              html,
              404,
              'noindex, follow'
            );
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


    const renderStaticPage =
      async (
        req,
        res,
        next
      ) => {
        try {
          const metadata =
            buildStaticPageMetadata(
              req.path
            );

          if (!metadata) {
            return next();
          }

          const html =
            await readFrontendHtml(
              frontendIndexPath
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
      renderStaticPage,
    };
  };

module.exports = {
  createSeoController,
};
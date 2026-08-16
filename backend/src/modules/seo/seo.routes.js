const express =
  require('express');

const {
  createSeoController,
} = require('./seo.controller');

const createSeoRouter =
  frontendIndexPath => {
    const router =
      express.Router();

    const {
      renderArticle,
      renderGallery,
      renderCategory,
      renderCollaborator,
      renderEdition,
    } =
      createSeoController(
        frontendIndexPath
      );

    router.get(
      '/articulos/:slug',
      renderArticle
    );

    router.get(
      '/galeria/:slug',
      renderGallery
    );

    router.get(
      '/categoria/:slug',
      renderCategory
    );

    router.get(
      '/colaborador/:slug',
      renderCollaborator
    );

    router.get(
      '/edicion/:number',
      renderEdition
    );

    return router;  
  };

module.exports =
  createSeoRouter;
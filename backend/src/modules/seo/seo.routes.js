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

    return router;
  };

module.exports =
  createSeoRouter;
const express =
  require('express');

const {
  renderArticleImage,
  renderGalleryImage,
} = require('./ogImages.controller');

const router =
  express.Router();

router.get(
  '/articulos/:slug',
  renderArticleImage
);

router.get(
  '/galerias/:slug',
  renderGalleryImage
);

module.exports =
  router;
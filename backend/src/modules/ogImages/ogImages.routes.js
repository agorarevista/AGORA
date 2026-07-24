const express =
  require('express');

const {
  renderArticleImage,
  renderGalleryImage,
} = require('./ogImages.controller');

const router =
  express.Router();

router.get(
  '/articulos/:slug.png',
  renderArticleImage
);

router.get(
  '/galerias/:slug.png',
  renderGalleryImage
);

module.exports =
  router;
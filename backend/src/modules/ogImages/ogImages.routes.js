const express =
  require('express');

const {
  renderArticleImage,
  renderGalleryImage,
} = require('./ogImages.controller');

const router =
  express.Router();

router.get(
  '/articulos/:slug.jpg',
  renderArticleImage
);

router.get(
  '/galerias/:slug.jpg',
  renderGalleryImage
);

module.exports =
  router;
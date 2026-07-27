const router =
  require('express')
    .Router();

const {
  getLikes,
  toggleLike,
  checkLike,
} = require(
  './likes.controller'
);

router.get(
  '/:content_type/:content_id/check',
  checkLike
);

router.post(
  '/:content_type/:content_id/toggle',
  toggleLike
);

router.get(
  '/:content_type/:content_id',
  getLikes
);

module.exports =
  router;
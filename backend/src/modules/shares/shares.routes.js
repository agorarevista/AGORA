const router =
  require('express')
    .Router();

const {
  registerShare,
  getShares,
} = require(
  './shares.controller'
);

router.post(
  '/:content_type/:content_id',
  registerShare
);

router.get(
  '/:content_type/:content_id',
  getShares
);

module.exports =
  router;
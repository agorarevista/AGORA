const express =
  require('express');

const controller =
  require(
    './notifications.controller'
  );

const router =
  express.Router();

router.get(
  '/public-key',
  controller.getPublicKey
);

router.post(
  '/subscribe',
  controller.subscribe
);

router.post(
  '/unsubscribe',
  controller.unsubscribe
);

module.exports =
  router;
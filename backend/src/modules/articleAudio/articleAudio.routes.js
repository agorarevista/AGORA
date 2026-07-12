const router = require('express').Router();

const {
  generateVoice,
  generateBoth,
  removeVoice,
} = require('./articleAudio.controller');

const {
  authMiddleware,
  requireRole,
} = require('../../middleware/auth');

router.use(
  authMiddleware,
  requireRole(
    'superadmin',
    'editor'
  )
);

router.post(
  '/:id/generate',
  generateVoice
);

router.post(
  '/:id/generate-both',
  generateBoth
);

router.delete(
  '/:id/:voice',
  removeVoice
);

module.exports = router;
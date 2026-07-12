const router = require('express').Router();

const {
  uploadFile,
  deleteFile,
} = require('./upload.controller');

const {
  uploadSingle,
  uploadMultiple,
  uploadErrorHandler,
} = require('../../middleware/upload');

const {
  authMiddleware,
} = require('../../middleware/auth');

router.post(
  '/',
  authMiddleware,
  ...uploadSingle,
  uploadFile
);

router.post(
  '/multiple',
  authMiddleware,
  ...uploadMultiple,
  uploadFile
);

router.delete(
  '/',
  authMiddleware,
  deleteFile
);

router.use(uploadErrorHandler);

module.exports = router;
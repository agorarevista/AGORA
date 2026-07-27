const router =
  require('express')
    .Router();

const {
  getByContent,
  getAll,
  create,
  updateStatus,
  remove,
} = require(
  './comments.controller'
);

const {
  authMiddleware,
  requireRole,
} = require(
  '../../middleware/auth'
);

router.get(
  '/content/:content_type/:content_id',
  getByContent
);

router.post(
  '/',
  create
);

router.get(
  '/',
  authMiddleware,
  requireRole(
    'superadmin',
    'editor'
  ),
  getAll
);

router.patch(
  '/:id/status',
  authMiddleware,
  requireRole(
    'superadmin',
    'editor'
  ),
  updateStatus
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole(
    'superadmin',
    'editor'
  ),
  remove
);

module.exports =
  router;
const router =
  require('express')
    .Router();

const {
  getAllPublic,
  getAllAdmin,
  getBySlug,
  getById,
  create,
  update,
  publish,
  archive,
  removePermanently,
} = require(
  './galleries.controller'
);

const {
  authMiddleware,
  requireRole,
} = require(
  '../../middleware/auth'
);

/* ══════════════════════════════════════════════════════
   RUTAS PÚBLICAS
══════════════════════════════════════════════════════ */

router.get(
  '/',
  getAllPublic
);

/* ══════════════════════════════════════════════════════
   RUTAS ADMINISTRATIVAS
   Deben ir antes de /:slug.
══════════════════════════════════════════════════════ */

router.get(
  '/admin/all',
  authMiddleware,
  requireRole(
    'superadmin',
    'editor'
  ),
  getAllAdmin
);

router.get(
  '/by-id/:id',
  authMiddleware,
  requireRole(
    'superadmin',
    'editor'
  ),
  getById
);

router.post(
  '/',
  authMiddleware,
  requireRole(
    'superadmin',
    'editor'
  ),
  create
);

router.put(
  '/:id',
  authMiddleware,
  requireRole(
    'superadmin',
    'editor'
  ),
  update
);

router.patch(
  '/:id/publish',
  authMiddleware,
  requireRole(
    'superadmin',
    'editor'
  ),
  publish
);

router.patch(
  '/:id/archive',
  authMiddleware,
  requireRole(
    'superadmin',
    'editor'
  ),
  archive
);

router.delete(
  '/:id/permanent',
  authMiddleware,
  requireRole(
    'superadmin'
  ),
  removePermanently
);

/* ══════════════════════════════════════════════════════
   GALERÍA PÚBLICA INDIVIDUAL
   SIEMPRE AL FINAL
══════════════════════════════════════════════════════ */

router.get(
  '/:slug',
  getBySlug
);

module.exports = router;
const router = require('express').Router();

const {
  getAll,
  getAllAdmin,
  getColumns,
  getBySlug,
  create,
  update,
  remove,
} = require('./categories.controller');

const {
  authMiddleware,
  requireRole,
} = require('../../middleware/auth');

/* ══════════════════════════════════════════════════════
   RUTAS PÚBLICAS
══════════════════════════════════════════════════════ */

/**
 * Categorías públicas activas.
 */
router.get('/', getAll);

/**
 * Todas las columnas fijas públicas.
 *
 * Debe declararse antes de /:slug para evitar que Express
 * interprete "columns" como el slug de una categoría.
 */
router.get('/columns', getColumns);

/* ══════════════════════════════════════════════════════
   RUTAS ADMINISTRATIVAS
══════════════════════════════════════════════════════ */

/**
 * Esta ruta debe estar antes de /:slug.
 *
 * Incluye:
 * - categorías padre;
 * - categorías hijas;
 * - activas;
 * - inactivas.
 */
router.get(
  '/admin/all',
  authMiddleware,
  requireRole('superadmin', 'editor'),
  getAllAdmin
);

/* ══════════════════════════════════════════════════════
   CATEGORÍA PÚBLICA POR SLUG
══════════════════════════════════════════════════════ */

router.get('/:slug', getBySlug);

/* ══════════════════════════════════════════════════════
   ESCRITURA
══════════════════════════════════════════════════════ */

router.post(
  '/',
  authMiddleware,
  requireRole('superadmin', 'editor'),
  create
);

router.put(
  '/:id',
  authMiddleware,
  requireRole('superadmin', 'editor'),
  update
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole('superadmin'),
  remove
);

module.exports = router;
const router =
  require('express').Router();

const {
  getAll,
  getActive,
  getById,
  create,
  update,
  open,
  close,
  remove,
} = require('./convocatorias.controller');

const {
  authMiddleware,
  requireRole,
} = require('../../middleware/auth');

/* ══════════════════════════════════════════════════════
   PÚBLICAS
══════════════════════════════════════════════════════ */

router.get('/', getAll);
router.get('/active', getActive);
router.get('/:id', getById);

/* ══════════════════════════════════════════════════════
   PROTEGIDAS
══════════════════════════════════════════════════════ */

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
  '/:id/open',
  authMiddleware,
  requireRole(
    'superadmin',
    'editor'
  ),
  open
);

router.patch(
  '/:id/close',
  authMiddleware,
  requireRole(
    'superadmin',
    'editor'
  ),
  close
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole('superadmin'),
  remove
);

module.exports = router;
const router = require('express').Router();
const { getAll, getBySlug, create, update, remove } = require('./collaborators.controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// Públicas
router.get('/', getAll);
router.get('/:slug', getBySlug);

// Protegidas
router.post('/', authMiddleware, requireRole('superadmin', 'editor'), create);
router.put('/:id', authMiddleware, requireRole('superadmin', 'editor'), update);
router.delete('/:id', authMiddleware, requireRole('superadmin'), remove);

module.exports = router;
const router = require('express').Router();
const { getAll, getActive, getById, create, update, remove } = require('./convocatorias.controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// Públicas
router.get('/', getAll);
router.get('/active', getActive);
router.get('/:id', getById);

// Protegidas
router.post('/', authMiddleware, requireRole('superadmin', 'editor'), create);
router.put('/:id', authMiddleware, requireRole('superadmin', 'editor'), update);
router.delete('/:id', authMiddleware, requireRole('superadmin'), remove);

module.exports = router;
const router = require('express').Router();
const { getAll, getById, create, update, remove } = require('./submissions.controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// Pública — cualquiera puede enviar
router.post('/', create);

// Protegidas — solo admins
router.get('/',    authMiddleware, requireRole('superadmin', 'editor'), getAll);
router.get('/:id', authMiddleware, requireRole('superadmin', 'editor'), getById);
router.put('/:id', authMiddleware, requireRole('superadmin', 'editor'), update);
router.delete('/:id', authMiddleware, requireRole('superadmin'), remove);

module.exports = router;
const router = require('express').Router();
const { getAll, getById, create, updateStatus } = require('./submissions.controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// Pública — cualquiera puede enviar
router.post('/', create);

// Protegidas — solo admins ven las submissions
router.get('/', authMiddleware, requireRole('superadmin', 'editor'), getAll);
router.get('/:id', authMiddleware, requireRole('superadmin', 'editor'), getById);
router.patch('/:id/status', authMiddleware, requireRole('superadmin', 'editor'), updateStatus);

module.exports = router;
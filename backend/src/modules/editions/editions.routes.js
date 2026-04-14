const router = require('express').Router();
const { getAll, getCurrent, getByNumber, create, update, setCurrent } = require('./editions.controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// Públicas
router.get('/', getAll);
router.get('/current', getCurrent);
router.get('/:number', getByNumber);

// Protegidas
router.post('/', authMiddleware, requireRole('superadmin', 'editor'), create);
router.put('/:id', authMiddleware, requireRole('superadmin', 'editor'), update);
router.patch('/:id/set-current', authMiddleware, requireRole('superadmin', 'editor'), setCurrent);

module.exports = router;
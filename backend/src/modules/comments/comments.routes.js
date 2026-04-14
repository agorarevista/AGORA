const router = require('express').Router();
const { getByArticle, getAll, create, updateStatus, remove } = require('./comments.controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// Públicas
router.get('/article/:article_id', getByArticle);
router.post('/', create);

// Protegidas
router.get('/', authMiddleware, requireRole('superadmin', 'editor'), getAll);
router.patch('/:id/status', authMiddleware, requireRole('superadmin', 'editor'), updateStatus);
router.delete('/:id', authMiddleware, requireRole('superadmin', 'editor'), remove);

module.exports = router;
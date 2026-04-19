const router = require('express').Router();
const {
  getAll, getBySlug, getById, getByCategory, getByCollaborator,
  getByEdition, getFeatured, getHome, search, create, update, remove, publish
} = require('./articles.controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// Públicas
router.get('/', getAll);
router.get('/home', getHome);
router.get('/featured', getFeatured);
router.get('/search', search);
router.get('/category/:slug', getByCategory);
router.get('/collaborator/:slug', getByCollaborator);
router.get('/edition/:number', getByEdition);
router.get('/by-id/:id', getById);
router.get('/:slug', getBySlug);

// Protegidas
router.post('/', authMiddleware, requireRole('superadmin', 'editor'), create);
router.put('/:id', authMiddleware, requireRole('superadmin', 'editor'), update);
router.patch('/:id/publish', authMiddleware, requireRole('superadmin', 'editor'), publish);
router.delete('/:id', authMiddleware, requireRole('superadmin'), remove);

module.exports = router;
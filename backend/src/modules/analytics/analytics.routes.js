const router = require('express').Router();
const { trackView, getDashboardStats } = require('./analytics.controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// Pública — el frontend registra visitas
router.post('/track', trackView);

// Protegida — solo admins ven estadísticas
router.get('/dashboard', authMiddleware, requireRole('superadmin', 'editor'), getDashboardStats);

module.exports = router;
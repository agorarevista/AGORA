const router = require('express').Router();
const {
  getUsers, createUser, updateUser, toggleUser,
  getDashboard, getSiteConfig, updateSiteConfig
} = require('./admin.controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

router.use(authMiddleware);

router.get('/dashboard', getDashboard);
router.get('/config', getSiteConfig);
router.put('/config', requireRole('superadmin'), updateSiteConfig);

router.get('/users', requireRole('superadmin'), getUsers);
router.post('/users', requireRole('superadmin'), createUser);
router.put('/users/:id', requireRole('superadmin'), updateUser);
router.patch('/users/:id/toggle', requireRole('superadmin'), toggleUser);

module.exports = router;
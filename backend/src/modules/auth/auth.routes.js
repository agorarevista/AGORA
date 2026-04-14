const router = require('express').Router();
const { login, changePassword, getProfile } = require('./auth.controller');
const { authMiddleware } = require('../../middleware/auth');

router.post('/login', login);
router.post('/change-password', authMiddleware, changePassword);
router.get('/profile', authMiddleware, getProfile);

module.exports = router;
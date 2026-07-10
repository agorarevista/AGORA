const express = require('express');
const router = express.Router();
const controller = require('./sponsors.controller');

const authModule = require('../../middleware/auth');

const auth =
  typeof authModule === 'function'
    ? authModule
    : authModule.authMiddleware || authModule.auth || authModule.default;

// ── Público ──────────────────────────────────────────
router.get('/', controller.getPublic);

// ── Admin ────────────────────────────────────────────
router.get('/all', auth, controller.getAll);
router.get('/:id', auth, controller.getById);
router.post('/', auth, controller.create);
router.put('/:id', auth, controller.update);
router.delete('/:id', auth, controller.remove);

module.exports = router;
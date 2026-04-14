const router = require('express').Router();
const { getLikes, toggleLike, checkLike } = require('./likes.controller');

router.get('/:article_id', getLikes);
router.get('/:article_id/check', checkLike);
router.post('/:article_id/toggle', toggleLike);

module.exports = router;
const router = require('express').Router();
const { registerShare, getSharesByArticle } = require('./shares.controller');

router.post('/:article_id', registerShare);
router.get('/:article_id', getSharesByArticle);

module.exports = router;
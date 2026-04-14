const service = require('./likes.service');

const getLikes = async (req, res, next) => {
  try { res.json(await service.getLikes(req.params.article_id)); }
  catch (err) { next(err); }
};

const toggleLike = async (req, res, next) => {
  try { res.json(await service.toggleLike(req.params.article_id, req)); }
  catch (err) { next(err); }
};

const checkLike = async (req, res, next) => {
  try { res.json(await service.checkLike(req.params.article_id, req)); }
  catch (err) { next(err); }
};

module.exports = { getLikes, toggleLike, checkLike };
const service = require('./shares.service');

const registerShare = async (req, res, next) => {
  try {
    res.json(await service.registerShare(req.params.article_id, req.body.platform));
  } catch (err) { next(err); }
};

const getSharesByArticle = async (req, res, next) => {
  try { res.json(await service.getSharesByArticle(req.params.article_id)); }
  catch (err) { next(err); }
};

module.exports = { registerShare, getSharesByArticle };
const service = require('./comments.service');

const getByArticle = async (req, res, next) => {
  try { res.json(await service.getByArticle(req.params.article_id)); }
  catch (err) { next(err); }
};

const getAll = async (req, res, next) => {
  try { res.json(await service.getAll({ status: req.query.status })); }
  catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try { res.status(201).json(await service.create(req.body)); }
  catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try { res.json(await service.updateStatus(req.params.id, req.body.status)); }
  catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    res.json({ message: 'Comentario eliminado' });
  } catch (err) { next(err); }
};

module.exports = { getByArticle, getAll, create, updateStatus, remove };
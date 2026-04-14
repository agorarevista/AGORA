const service = require('./articles.service');

const getAll = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    res.json(await service.getAll({ page, limit }));
  } catch (err) { next(err); }
};

const getBySlug = async (req, res, next) => {
  try {
    res.json(await service.getBySlug(req.params.slug));
  } catch (err) { next(err); }
};

const getByCategory = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    res.json(await service.getByCategory(req.params.slug, { page, limit }));
  } catch (err) { next(err); }
};

const getByCollaborator = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    res.json(await service.getByCollaborator(req.params.slug, { page, limit }));
  } catch (err) { next(err); }
};

const getByEdition = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    res.json(await service.getByEdition(req.params.number, { page, limit }));
  } catch (err) { next(err); }
};

const getFeatured = async (req, res, next) => {
  try {
    res.json(await service.getFeatured());
  } catch (err) { next(err); }
};

const search = async (req, res, next) => {
  try {
    const { q, page, limit } = req.query;
    res.json(await service.search(q, { page, limit }));
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    res.status(201).json(await service.create(req.body));
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    res.json(await service.update(req.params.id, req.body));
  } catch (err) { next(err); }
};

const publish = async (req, res, next) => {
  try {
    res.json(await service.publish(req.params.id));
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    res.json({ message: 'Artículo archivado' });
  } catch (err) { next(err); }
};

module.exports = {
  getAll, getBySlug, getByCategory, getByCollaborator,
  getByEdition, getFeatured, search, create, update, publish, remove
};
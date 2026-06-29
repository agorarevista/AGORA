const service = require('./submissions.service');

const getAll = async (req, res, next) => {
  try {
    const { convocatoria_id, status } = req.query;
    res.json(await service.getAll({ convocatoria_id, status }));
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try { res.json(await service.getById(req.params.id)); }
  catch (err) { next(err); }
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

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    res.json({ message: 'Envío eliminado' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove };
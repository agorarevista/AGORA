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

const updateStatus = async (req, res, next) => {
  try {
    const { status, admin_notes } = req.body;
    res.json(await service.updateStatus(req.params.id, status, admin_notes, req.user.id));
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, updateStatus };
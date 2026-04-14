const service = require('./editions.service');

const getAll = async (req, res, next) => {
  try { res.json(await service.getAll()); }
  catch (err) { next(err); }
};

const getCurrent = async (req, res, next) => {
  try { res.json(await service.getCurrent()); }
  catch (err) { next(err); }
};

const getByNumber = async (req, res, next) => {
  try { res.json(await service.getByNumber(req.params.number)); }
  catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try { res.status(201).json(await service.create(req.body)); }
  catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try { res.json(await service.update(req.params.id, req.body)); }
  catch (err) { next(err); }
};

const setCurrent = async (req, res, next) => {
  try { res.json(await service.setCurrent(req.params.id)); }
  catch (err) { next(err); }
};

module.exports = { getAll, getCurrent, getByNumber, create, update, setCurrent };
const service = require('./collaborators.service');

const getAll = async (req, res, next) => {
  try {
    const { q } = req.query;
    const data = await service.getAll({ q });
    res.json(data);
  } catch (err) { next(err); }
};

const getBySlug = async (req, res, next) => {
  try {
    const data = await service.getBySlug(req.params.slug);
    res.json(data);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await service.create(req.body);
    res.status(201).json(data);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await service.update(req.params.id, req.body);
    res.json(data);
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const deletedCollaborator =
      await service.remove(
        req.params.id
      );

    return res.json({
      message:
        'Colaborador eliminado permanentemente',

      collaborator:
        deletedCollaborator,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, getBySlug, create, update, remove };
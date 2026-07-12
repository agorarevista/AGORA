const service = require('./categories.service');

/**
 * Devuelve las categorías públicas:
 * solo activas y visibles en la navegación.
 */
const getAll = async (req, res, next) => {
  try {
    const data = await service.getAll();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * Devuelve todas las categorías para el panel administrativo:
 * padres, hijas, activas e inactivas.
 */
const getAllAdmin = async (req, res, next) => {
  try {
    const data = await service.getAllAdmin();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * Devuelve todas las columnas fijas públicas.
 */
const getColumns = async (req, res, next) => {
  try {
    const data = await service.getColumns();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const getBySlug = async (req, res, next) => {
  try {
    const data = await service.getBySlug(req.params.slug);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await service.create(req.body);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await service.update(
      req.params.id,
      req.body
    );

    res.json(data);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id);

    res.json({
      message: 'Categoría despublicada correctamente',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getAllAdmin,
  getColumns,
  getBySlug,
  create,
  update,
  remove,
};
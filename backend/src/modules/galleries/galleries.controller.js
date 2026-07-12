const service =
  require('./galleries.service');

const getAllPublic = async (
  req,
  res,
  next
) => {
  try {
    const {
      page,
      limit,
      search,
    } = req.query;

    const result =
      await service.getAll({
        page,
        limit,
        search,
        status:
          'published',
      });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const getAllAdmin = async (
  req,
  res,
  next
) => {
  try {
    const {
      page,
      limit,
      status,
      search,
    } = req.query;

    const result =
      await service.getAll({
        page,
        limit,
        status:
          status || 'all',
        search,
      });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const getBySlug = async (
  req,
  res,
  next
) => {
  try {
    const gallery =
      await service.getBySlug(
        req.params.slug
      );

    return res.json(gallery);
  } catch (error) {
    return next(error);
  }
};

const getById = async (
  req,
  res,
  next
) => {
  try {
    const gallery =
      await service.getById(
        req.params.id
      );

    return res.json(gallery);
  } catch (error) {
    return next(error);
  }
};

const create = async (
  req,
  res,
  next
) => {
  try {
    const gallery =
      await service.create(
        req.body
      );

    return res
      .status(201)
      .json(gallery);
  } catch (error) {
    return next(error);
  }
};

const update = async (
  req,
  res,
  next
) => {
  try {
    const gallery =
      await service.update(
        req.params.id,
        req.body
      );

    return res.json(gallery);
  } catch (error) {
    return next(error);
  }
};

const publish = async (
  req,
  res,
  next
) => {
  try {
    const gallery =
      await service.publish(
        req.params.id
      );

    return res.json(gallery);
  } catch (error) {
    return next(error);
  }
};

const archive = async (
  req,
  res,
  next
) => {
  try {
    const gallery =
      await service.archive(
        req.params.id
      );

    return res.json({
      message:
        'Galería archivada correctamente',

      gallery,
    });
  } catch (error) {
    return next(error);
  }
};

const removePermanently =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service
          .removePermanently(
            req.params.id
          );

      return res.json(result);
    } catch (error) {
      return next(error);
    }
  };

module.exports = {
  getAllPublic,
  getAllAdmin,
  getBySlug,
  getById,
  create,
  update,
  publish,
  archive,
  removePermanently,
};
const service =
  require('./comments.service');

const getByContent = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await service.getByContent({
        contentType:
          req.params.content_type,

        contentId:
          req.params.content_id,
      });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const getAll = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await service.getAll({
        status:
          req.query.status,
      });

    return res.json(result);
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
    const result =
      await service.create(
        req.body
      );

    return res
      .status(201)
      .json(result);
  } catch (error) {
    return next(error);
  }
};

const updateStatus = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await service.updateStatus(
        req.params.id,
        req.body.status
      );

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const remove = async (
  req,
  res,
  next
) => {
  try {
    await service.remove(
      req.params.id
    );

    return res.json({
      message:
        'Comentario eliminado',
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getByContent,
  getAll,
  create,
  updateStatus,
  remove,
};
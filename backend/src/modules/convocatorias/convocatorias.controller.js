const service =
  require('./convocatorias.service');

const getAll = async (
  req,
  res,
  next
) => {
  try {
    res.json(
      await service.getAll()
    );
  } catch (error) {
    next(error);
  }
};

const getActive = async (
  req,
  res,
  next
) => {
  try {
    res.json(
      await service.getActive()
    );
  } catch (error) {
    next(error);
  }
};

const getById = async (
  req,
  res,
  next
) => {
  try {
    res.json(
      await service.getById(
        req.params.id
      )
    );
  } catch (error) {
    next(error);
  }
};

const create = async (
  req,
  res,
  next
) => {
  try {
    const data =
      await service.create(
        req.body
      );

    res
      .status(201)
      .json(data);
  } catch (error) {
    next(error);
  }
};

const update = async (
  req,
  res,
  next
) => {
  try {
    res.json(
      await service.update(
        req.params.id,
        req.body
      )
    );
  } catch (error) {
    next(error);
  }
};

const open = async (
  req,
  res,
  next
) => {
  try {
    const data =
      await service.open(
        req.params.id
      );

    res.json({
      message:
        'Colaboración abierta correctamente',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const close = async (
  req,
  res,
  next
) => {
  try {
    const data =
      await service.close(
        req.params.id
      );

    res.json({
      message:
        'Colaboración cerrada correctamente',
      data,
    });
  } catch (error) {
    next(error);
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

    res.json({
      message:
        'Colaboración eliminada definitivamente',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getActive,
  getById,
  create,
  update,
  open,
  close,
  remove,
};
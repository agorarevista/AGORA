const service =
  require('./galleries.service');

/* ══════════════════════════════════════════════════════
   LISTADO PÚBLICO
══════════════════════════════════════════════════════ */

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
        status: 'published',
      });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/* ══════════════════════════════════════════════════════
   LISTADO ADMINISTRATIVO
══════════════════════════════════════════════════════ */

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

/* ══════════════════════════════════════════════════════
   BÚSQUEDA PÚBLICA
══════════════════════════════════════════════════════ */

const search = async (
  req,
  res,
  next
) => {
  try {
    const {
      q,
      page,
      limit,
    } = req.query;

    const result =
      await service.search(
        q,
        {
          page,
          limit,
        }
      );

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/* ══════════════════════════════════════════════════════
   DESTACADAS
══════════════════════════════════════════════════════ */

const getFeatured = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await service.getFeatured();

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/* ══════════════════════════════════════════════════════
   GALERÍAS POR COLABORADOR
══════════════════════════════════════════════════════ */

const getByCollaborator = async (
  req,
  res,
  next
) => {
  try {
    const {
      page,
      limit,
    } = req.query;

    const result =
      await service.getByCollaborator(
        req.params.slug,
        {
          page,
          limit,
        }
      );

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/* ══════════════════════════════════════════════════════
   GALERÍAS POR EDICIÓN
══════════════════════════════════════════════════════ */

const getByEdition = async (
  req,
  res,
  next
) => {
  try {
    const {
      page,
      limit,
    } = req.query;

    const result =
      await service.getByEdition(
        req.params.number,
        {
          page,
          limit,
        }
      );

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/* ══════════════════════════════════════════════════════
   GALERÍA POR SLUG
══════════════════════════════════════════════════════ */

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

/* ══════════════════════════════════════════════════════
   GALERÍA POR ID
══════════════════════════════════════════════════════ */

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

/* ══════════════════════════════════════════════════════
   CREAR
══════════════════════════════════════════════════════ */

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

/* ══════════════════════════════════════════════════════
   ACTUALIZAR
══════════════════════════════════════════════════════ */

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

/* ══════════════════════════════════════════════════════
   PUBLICAR
══════════════════════════════════════════════════════ */

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

/* ══════════════════════════════════════════════════════
   ARCHIVAR
══════════════════════════════════════════════════════ */

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

/* ══════════════════════════════════════════════════════
   ELIMINAR PERMANENTEMENTE
══════════════════════════════════════════════════════ */

const removePermanently = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await service.removePermanently(
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
  search,
  getFeatured,
  getByCollaborator,
  getByEdition,
  getBySlug,
  getById,
  create,
  update,
  publish,
  archive,
  removePermanently,
};
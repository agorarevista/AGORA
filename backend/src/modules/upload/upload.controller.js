const {
  uploadFile: uploadToR2,
  deleteFile: deleteFromR2,
} = require('./upload.service');

const ALLOWED_FOLDERS = new Set([
  'misc',
  'covers',
  'articles',
  'articles/images',
  'articles/videos',
  'convocatorias',
  'collaborators',
  'editions',
  'sponsors',
  'submissions',
]);

const resolveFolder = (requestedFolder) => {
  const normalizedFolder = String(requestedFolder || 'misc')
    .trim()
    .toLowerCase()
    .replace(/^\/|\/$/g, '');

  if (!ALLOWED_FOLDERS.has(normalizedFolder)) {
    return 'misc';
  }

  return normalizedFolder;
};

const uploadFile = async (req, res, next) => {
  try {
    const folder = resolveFolder(req.query.folder);

    if (Array.isArray(req.files) && req.files.length > 0) {
      const results = await Promise.all(
        req.files.map(file => uploadToR2(file, folder))
      );

      return res.status(201).json(results);
    }

    if (req.file) {
      const result = await uploadToR2(req.file, folder);

      return res.status(201).json(result);
    }

    return res.status(400).json({
      error: 'No se recibió ningún archivo.',
      code: 'NO_FILE_RECEIVED',
    });
  } catch (error) {
    return next(error);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    const { key } = req.body;

    if (!key || typeof key !== 'string') {
      return res.status(400).json({
        error: 'La key del archivo es requerida.',
        code: 'FILE_KEY_REQUIRED',
      });
    }

    await deleteFromR2(key);

    return res.json({
      message: 'Archivo eliminado correctamente.',
      key,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  uploadFile,
  deleteFile,
};
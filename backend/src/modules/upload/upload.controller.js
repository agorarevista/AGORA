const { uploadFile: uploadToR2, deleteFile: deleteFromR2 } = require('./upload.service');

const uploadFile = async (req, res, next) => {
  try {
    const folder = req.query.folder || 'misc';

    if (req.files && req.files.length > 0) {
      // Múltiples archivos
      const results = await Promise.all(
        req.files.map(file => uploadToR2(file, folder))
      );
      return res.json(results);
    }

    if (req.file) {
      // Un solo archivo
      const result = await uploadToR2(req.file, folder);
      return res.json(result);
    }

    res.status(400).json({ error: 'No se recibió ningún archivo' });
  } catch (err) { next(err); }
};

const deleteFile = async (req, res, next) => {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'Key requerida' });
    await deleteFromR2(key);
    res.json({ message: 'Archivo eliminado' });
  } catch (err) { next(err); }
};

module.exports = { uploadFile, deleteFile };
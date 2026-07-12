const multer = require('multer');
const path = require('path');

const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_VIDEO_SIZE = 150 * 1024 * 1024; // 150 MB
const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024; // 25 MB
const MAX_GENERAL_SIZE = 150 * 1024 * 1024; // Límite superior de Multer

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
]);

const ALLOWED_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.avif',
  '.mp4',
  '.webm',
  '.ogv',
  '.ogg',
  '.mov',
  '.pdf',
  '.doc',
  '.docx',
]);

const storage = multer.memoryStorage();

const getFileCategory = (file) => {
  if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
    return 'image';
  }

  if (ALLOWED_VIDEO_TYPES.has(file.mimetype)) {
    return 'video';
  }

  if (ALLOWED_DOCUMENT_TYPES.has(file.mimetype)) {
    return 'document';
  }

  return null;
};

const fileFilter = (req, file, callback) => {
  const extension = path.extname(file.originalname || '').toLowerCase();
  const category = getFileCategory(file);

  if (!category || !ALLOWED_EXTENSIONS.has(extension)) {
    const error = new Error(
      'Tipo de archivo no permitido. Se aceptan imágenes, videos MP4/WebM/MOV, PDF, DOC y DOCX.'
    );

    error.status = 400;
    error.code = 'INVALID_FILE_TYPE';

    return callback(error);
  }

  file.uploadCategory = category;

  return callback(null, true);
};

const uploader = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_GENERAL_SIZE,
    files: 10,
  },
});

const validateUploadedFileSize = (req, res, next) => {
  const files = [];

  if (req.file) {
    files.push(req.file);
  }

  if (Array.isArray(req.files)) {
    files.push(...req.files);
  }

  for (const file of files) {
    const category = file.uploadCategory || getFileCategory(file);

    if (category === 'image' && file.size > MAX_IMAGE_SIZE) {
      return res.status(413).json({
        error: `La imagen "${file.originalname}" supera el límite de 20 MB.`,
        code: 'IMAGE_TOO_LARGE',
      });
    }

    if (category === 'video' && file.size > MAX_VIDEO_SIZE) {
      return res.status(413).json({
        error: `El video "${file.originalname}" supera el límite de 150 MB.`,
        code: 'VIDEO_TOO_LARGE',
      });
    }

    if (category === 'document' && file.size > MAX_DOCUMENT_SIZE) {
      return res.status(413).json({
        error: `El documento "${file.originalname}" supera el límite de 25 MB.`,
        code: 'DOCUMENT_TOO_LARGE',
      });
    }
  }

  return next();
};

const uploadSingle = [
  uploader.single('file'),
  validateUploadedFileSize,
];

const uploadMultiple = [
  uploader.array('files', 10),
  validateUploadedFileSize,
];

const uploadErrorHandler = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'El archivo supera el límite máximo permitido de 150 MB.',
        code: 'FILE_TOO_LARGE',
      });
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Solo puedes subir un máximo de 10 archivos al mismo tiempo.',
        code: 'TOO_MANY_FILES',
      });
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'El campo utilizado para subir el archivo no es válido.',
        code: 'UNEXPECTED_FILE_FIELD',
      });
    }

    return res.status(400).json({
      error: error.message || 'Error procesando el archivo.',
      code: error.code || 'UPLOAD_ERROR',
    });
  }

  if (
    error?.code === 'INVALID_FILE_TYPE' ||
    error?.status === 400
  ) {
    return res.status(400).json({
      error: error.message,
      code: error.code || 'INVALID_UPLOAD',
    });
  }

  return next(error);
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadErrorHandler,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_DOCUMENT_TYPES,
};
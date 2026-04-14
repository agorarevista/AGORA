const router = require('express').Router();
const multer = require('multer');
const { uploadFile, deleteFile } = require('./upload.controller');
const { authMiddleware } = require('../../middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB máximo
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  }
});

router.post('/', authMiddleware, upload.single('file'), uploadFile);
router.post('/multiple', authMiddleware, upload.array('files', 10), uploadFile);
router.delete('/', authMiddleware, deleteFile);

module.exports = router;
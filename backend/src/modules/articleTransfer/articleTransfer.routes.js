const router =
  require('express').Router();

const multer =
  require('multer');

const {
  authMiddleware,
  requireRole,
} = require(
  '../../middleware/auth'
);

const {
  importSubstack,
  exportArticleHtml,
  exportWordPress,
} = require(
  './articleTransfer.controller'
);

const transferUpload =
  multer({
    storage:
      multer.memoryStorage(),

    limits: {
      fileSize:
        150 * 1024 * 1024,

      files: 100,
    },

    fileFilter:
      (
        req,
        file,
        callback
      ) => {
        const filename =
          String(
            file.originalname ||
            ''
          ).toLowerCase();

        const valid =
          filename.endsWith(
            '.html'
          ) ||
          filename.endsWith(
            '.htm'
          ) ||
          filename.endsWith(
            '.zip'
          );

        if (!valid) {
          const error =
            new Error(
              'Solo se aceptan archivos HTML, HTM o ZIP exportados desde Substack.'
            );

          error.status = 400;

          return callback(
            error
          );
        }

        return callback(
          null,
          true
        );
      },
  });

router.use(
  authMiddleware
);

router.use(
  requireRole(
    'superadmin',
    'editor'
  )
);

router.post(
  '/substack/import',
  transferUpload.array(
    'files',
    100
  ),
  importSubstack
);

router.get(
  '/export/wordpress',
  exportWordPress
);

router.get(
  '/export/:id/html',
  exportArticleHtml
);

module.exports = router;
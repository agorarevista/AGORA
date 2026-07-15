require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const corsMiddleware = require('./config/cors');
const errorHandler = require('./middleware/errorHandler');

const app = express();

/* ══════════════════════════════════════════════════════
   MIDDLEWARES GLOBALES
══════════════════════════════════════════════════════ */

app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(corsMiddleware);

app.use(
  express.json({
    limit: '10mb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

/* ══════════════════════════════════════════════════════
   RUTAS
══════════════════════════════════════════════════════ */

app.use(
  '/api/auth',
  require('./modules/auth/auth.routes')
);

app.use(
  '/api/articles',
  require('./modules/articles/articles.routes')
);

app.use(
  '/api/galleries',
  require('./modules/galleries/galleries.routes')
);

app.use(
  '/api/categories',
  require('./modules/categories/categories.routes')
);

app.use(
  '/api/collaborators',
  require('./modules/collaborators/collaborators.routes')
);

app.use(
  '/api/editions',
  require('./modules/editions/editions.routes')
);

app.use(
  '/api/convocatorias',
  require('./modules/convocatorias/convocatorias.routes')
);

app.use(
  '/api/sponsors',
  require('./modules/sponsors/sponsors.routes')
);

app.use(
  '/api/admin',
  require('./modules/admin/admin.routes')
);

app.use(
  '/api/upload',
  require('./modules/upload/upload.routes')
);

app.use(
  '/api/likes',
  require('./modules/likes/likes.routes')
);

app.use(
  '/api/comments',
  require('./modules/comments/comments.routes')
);

app.use(
  '/api/shares',
  require('./modules/shares/shares.routes')
);

app.use(
  '/api/analytics',
  require('./modules/analytics/analytics.routes')
);

app.use(
  '/api/article-audio',
  require('./modules/articleAudio/articleAudio.routes')
);

app.use(
  '/api/article-transfer',
  require('./modules/articleTransfer/articleTransfer.routes')
);

/* ══════════════════════════════════════════════════════
   HEALTH CHECK
══════════════════════════════════════════════════════ */

app.get(
  '/api/health',
  (req, res) => {
    res.json({
      status: 'ok',
      timestamp:
        new Date().toISOString(),
    });
  }
);

/* ══════════════════════════════════════════════════════
   MANEJADOR GLOBAL DE ERRORES
   SIEMPRE DEBE PERMANECER AL FINAL
══════════════════════════════════════════════════════ */

app.use(errorHandler);

module.exports = app;
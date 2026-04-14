require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Middlewares globales ──────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rutas ─────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./modules/auth/auth.routes'));
app.use('/api/articles',      require('./modules/articles/articles.routes'));
app.use('/api/categories',    require('./modules/categories/categories.routes'));
app.use('/api/collaborators', require('./modules/collaborators/collaborators.routes'));
app.use('/api/editions',      require('./modules/editions/editions.routes'));
app.use('/api/convocatorias', require('./modules/convocatorias/convocatorias.routes'));
app.use('/api/submissions',   require('./modules/submissions/submissions.routes'));
app.use('/api/admin',         require('./modules/admin/admin.routes'));
app.use('/api/upload',        require('./modules/upload/upload.routes'));
app.use('/api/likes',         require('./modules/likes/likes.routes'));
app.use('/api/comments',      require('./modules/comments/comments.routes'));
app.use('/api/shares',        require('./modules/shares/shares.routes'));
app.use('/api/analytics',     require('./modules/analytics/analytics.routes'));

// ── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Manejador de errores (siempre al final) ───────────────────────────────
app.use(errorHandler);

module.exports = app;
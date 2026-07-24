const path = require('path');

require('dotenv').config({
  path: path.resolve(
    __dirname,
    '../.env'
  ),
});

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const fs = require('fs');

const corsMiddleware = require('./config/cors');
const supabase = require('./config/supabase');
const errorHandler = require('./middleware/errorHandler');

const app = express();

/* ══════════════════════════════════════════════════════
   FRONTEND COMPILADO

   Este archivo está ubicado en:

   backend/src/app.js

   Desde aquí subimos dos niveles hasta la raíz
   y entramos a:

   frontend/dist
══════════════════════════════════════════════════════ */

const frontendDistPath = path.resolve(
  __dirname,
  '../../frontend/dist'
);

const frontendIndexPath = path.join(
  frontendDistPath,
  'index.html'
);

/* ══════════════════════════════════════════════════════
   MIDDLEWARES GLOBALES
══════════════════════════════════════════════════════ */

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin',
    },

    contentSecurityPolicy: {
      directives: {
        defaultSrc: [
          "'self'",
        ],

        connectSrc: [
          "'self'",
          'https://agora-backend-jdpx.onrender.com',
          'https://*.supabase.co',
          'wss://*.supabase.co',
          'http://localhost:3001',
          'http://localhost:5173',
        ],

        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https:',
        ],

        mediaSrc: [
          "'self'",
          'blob:',
          'https:',
        ],

        fontSrc: [
          "'self'",
          'data:',
          'https:',
        ],

        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https:',
        ],

        scriptSrc: [
          "'self'",
        ],
      },
    },
  })
);

app.use(compression());
app.use(morgan('dev'));
app.use(cookieParser());

/*
 * CORS únicamente para la API.
 *
 * No debe ejecutarse sobre:
 *
 * /assets
 * /favicon.ico
 * /site.webmanifest
 * páginas públicas de React
 */
app.use(
  '/api',
  corsMiddleware
);

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
   RUTAS DE API
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
   KEEP ALIVE
   CONSULTA REAL A SUPABASE
══════════════════════════════════════════════════════ */

app.get(
  '/api/keep-alive',
  async (req, res, next) => {
    try {
      const { data, error } =
        await supabase
          .from('articles')
          .select('id')
          .limit(1);

      if (error) {
        throw error;
      }

      res.set(
        'Cache-Control',
        'no-store'
      );

      return res.status(200).json({
        status: 'ok',
        database: 'connected',
        queryExecuted: true,

        recordsFound:
          Array.isArray(data)
            ? data.length
            : 0,

        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        'Supabase keep-alive error:',
        error
      );

      return next(error);
    }
  }
);

/* ══════════════════════════════════════════════════════
   HEALTH CHECK
   SOLO COMPRUEBA EL SERVIDOR
══════════════════════════════════════════════════════ */

app.get(
  '/api/health',
  (req, res) => {
    res.set(
      'Cache-Control',
      'no-store'
    );

    return res.status(200).json({
      status: 'ok',

      timestamp:
        new Date().toISOString(),
    });
  }
);

/* ══════════════════════════════════════════════════════
   FRONTEND REACT COMPILADO
══════════════════════════════════════════════════════ */

if (fs.existsSync(frontendIndexPath)) {
  console.log(
    `✅ Frontend encontrado en: ${frontendDistPath}`
  );

  /*
   * Entrega los archivos compilados por Vite:
   *
   * /assets/index.js
   * /assets/index.css
   * /fonts
   * /favicon.ico
   * /site.webmanifest
   */
  app.use(
    express.static(
      frontendDistPath,
      {
        index: false,

        maxAge:
          process.env.NODE_ENV ===
          'production'
            ? '1d'
            : 0,

        fallthrough: true,
      }
    )
  );

  /* ══════════════════════════════════════════════════════
     SEO
     SITEMAP Y ROBOTS

     Se coloca después de los archivos estáticos para evitar
     que /assets/*.css y /assets/*.js sean interceptados.
  ═══════════════════════════════════════════════════════ */

  app.use(
    '/',
    require('./modules/sitemap/sitemap.routes')
  );

  /*
   * Fallback para React Router.
   *
   * Ejemplos:
   *
   * /
   * /articulos/:slug
   * /galeria/:slug
   * /categoria/:slug
   * /admin/login
   *
   * Las rutas /api ya fueron procesadas antes.
   */
  app.use(
    (req, res, next) => {
      if (
        req.method !== 'GET'
      ) {
        return next();
      }

      if (
        req.path.startsWith(
          '/api/'
        )
      ) {
        return next();
      }

      return res.sendFile(
        frontendIndexPath,
        error => {
          if (error) {
            return next(error);
          }

          return undefined;
        }
      );
    }
  );
} else {
  console.warn(
    '⚠️ No se encontró frontend/dist/index.html.'
  );

  console.warn(
    '⚠️ Ejecuta: npm run build --prefix frontend'
  );
}

/* ══════════════════════════════════════════════════════
   RUTA 404 PARA API

   Evita que una ruta /api inexistente entregue React.
══════════════════════════════════════════════════════ */

app.use(
  '/api',
  (req, res) => {
    return res.status(404).json({
      error:
        'Ruta de API no encontrada',
    });
  }
);

/* ══════════════════════════════════════════════════════
   MANEJADOR GLOBAL DE ERRORES
   SIEMPRE DEBE PERMANECER AL FINAL
══════════════════════════════════════════════════════ */

app.use(errorHandler);

module.exports = app;
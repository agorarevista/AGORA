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
const cron = require('node-cron');

const corsMiddleware = require('./config/cors');
const supabase = require('./config/supabase');
const errorHandler = require('./middleware/errorHandler');

const {
  cleanupNotificationLogs,
} = require(
  './modules/notifications/notifications.service'
);

const app = express();

 

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

          /* YouTube */
          'https://www.youtube.com',
          'https://www.youtube-nocookie.com',

          /* Instagram */
          'https://www.instagram.com',

          /* TikTok */
          'https://www.tiktok.com',

          /* Vimeo */
          'https://player.vimeo.com',

          /* Google Drive */
          'https://drive.google.com',

          /* Google AdSense */
          'https://pagead2.googlesyndication.com',
          'https://googleads.g.doubleclick.net',
          'https://*.google.com',
          'https://*.googleusercontent.com',
          'https://*.googlesyndication.com',
          'https://*.doubleclick.net',
          'https://*.adtrafficquality.google',
        ],

        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https:',

          /* Google AdSense */
          'https://*.googlesyndication.com',
          'https://*.doubleclick.net',
          'https://*.googleusercontent.com',
          'https://*.google.com',
          'https://*.adtrafficquality.google',
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

          /* YouTube */
          'https://www.youtube.com',
          'https://www.youtube-nocookie.com',

          /* Instagram */
          'https://www.instagram.com',

          /* TikTok */
          'https://www.tiktok.com',

          /* Vimeo */
          'https://player.vimeo.com',

          /* Google Drive */
          'https://drive.google.com',

          /* Google AdSense */
          'https://pagead2.googlesyndication.com',
          'https://*.googlesyndication.com',
          'https://*.doubleclick.net',
          'https://*.google.com',
          'https://*.adtrafficquality.google',
        ],

 
        workerSrc: [
          "'self'",
          'blob:',
        ],

        frameSrc: [
          "'self'",

          /* YouTube */
          'https://www.youtube.com',
          'https://www.youtube-nocookie.com',

          /* Instagram Reels y publicaciones */
          'https://www.instagram.com',

          /* TikTok */
          'https://www.tiktok.com',

          /* Vimeo */
          'https://player.vimeo.com',

          /* Google Drive */
          'https://drive.google.com',

          /* Google AdSense */
          'https://googleads.g.doubleclick.net',
          'https://*.doubleclick.net',
          'https://*.googlesyndication.com',
          'https://*.google.com',
          'https://*.adtrafficquality.google',
        ],
 
        childSrc: [
          "'self'",
          'blob:',

 
          'https://www.youtube.com',
          'https://www.youtube-nocookie.com',
          'https://www.instagram.com',
          'https://www.tiktok.com',
          'https://player.vimeo.com',
          'https://drive.google.com',

 
          'https://googleads.g.doubleclick.net',
          'https://*.doubleclick.net',
          'https://*.googlesyndication.com',
          'https://*.google.com',
          'https://*.adtrafficquality.google',
        ],
      },
    },
  })
);

app.use(compression());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(
  '/admin',
  (req, res, next) => {
    res.set(
      'X-Robots-Tag',
      'noindex, nofollow'
    );

    return next();
  }
);


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

app.use(
  '/api/notifications',
  require('./modules/notifications/notifications.routes')
);

 

cron.schedule(
  '0 3 * * *',
  async () => {
    try {
      await cleanupNotificationLogs();
    } catch (error) {
      console.error(
        '❌ Error limpiando el historial Push:',
        error
      );
    }
  },
  {
    timezone:
      'America/Mazatlan',
  }
);

 

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

 
if (fs.existsSync(frontendIndexPath)) {
  console.log(
    `✅ Frontend encontrado en: ${frontendDistPath}`
  );
 
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

 

  app.use(
    '/og',
    require('./modules/ogImages/ogImages.routes')
  );

  app.use(
    (req, res, next) => {
      if (req.method !== 'GET') {
        return next();
      }

      let match =
        req.path.match(
          /^\/articulo\/(.+)$/
        );

      if (match) {
        const cleanSlug =
          match[1].replace(
            /-[0-9]{13}$/,
            ''
          );

        return res.redirect(
          301,
          `/articulos/${cleanSlug}`
        );
      }

      match =
        req.path.match(
          /^\/articulos\/(.+)-[0-9]{13}$/
        );

      if (match) {
        return res.redirect(
          301,
          `/articulos/${match[1]}`
        );
      }

      return next();
    }
  );

 

  app.use(
    '/',
    require('./modules/seo/seo.routes')(
      frontendIndexPath
    )
  );
 

  app.use(
    '/',
    require('./modules/sitemap/sitemap.routes')
  );

 
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

 

app.use(
  '/api',
  (req, res) => {
    return res.status(404).json({
      error:
        'Ruta de API no encontrada',
    });
  }
);

 

app.use(errorHandler);

module.exports = app;
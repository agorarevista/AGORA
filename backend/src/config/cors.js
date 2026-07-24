const cors = require('cors');

const allowedOrigins = [
  'http://localhost:3001',
  'http://127.0.0.1:3001',

  'http://localhost:5173',
  'http://127.0.0.1:5173',

  'https://agora-fronted.onrender.com',
  'https://agora-backend-jdpx.onrender.com',

  'https://agorarevista.mx',
  'https://www.agorarevista.mx',

  process.env.FRONTEND_URL,
].filter(Boolean);

const corsMiddleware = cors({
  origin(origin, callback) {
    /*
     * Permite solicitudes sin encabezado Origin.
     *
     * Ejemplos:
     * navegación directa,
     * Postman,
     * curl,
     * bots,
     * servidores externos.
     */
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(
      `⚠️ Origen bloqueado por CORS: ${origin}`
    );

    return callback(
      new Error(
        `Not allowed by CORS: ${origin}`
      )
    );
  },

  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
  ],

  optionsSuccessStatus: 204,
});

module.exports = corsMiddleware;
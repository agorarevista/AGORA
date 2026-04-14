const cors = require('cors');

const allowedOrigins = [
  'http://localhost:5173',
  'https://agora-fronted.onrender.com',
  process.env.FRONTEND_URL,
].filter(Boolean);

module.exports = cors({
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
});
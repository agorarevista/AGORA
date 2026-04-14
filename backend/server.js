require('dotenv').config();
const app = require('./src/app');
const cron = require('node-cron');

const PORT = process.env.PORT || 3001;

// Cron job: revisa convocatorias vencidas cada hora
cron.schedule('0 * * * *', async () => {
  try {
    const { autoCloseConvocatorias } = require('./src/modules/convocatorias/convocatorias.service');
    await autoCloseConvocatorias();
    console.log('⏰ Convocatorias revisadas');
  } catch (err) {
    console.error('Error en cron:', err.message);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Agorá API corriendo en http://localhost:${PORT}`);
});
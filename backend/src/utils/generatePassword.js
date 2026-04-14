const crypto = require('crypto');

const generateTempPassword = () => {
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  const year = new Date().getFullYear();
  return `Agora-${randomPart}-${year}`;
};

module.exports = { generateTempPassword };
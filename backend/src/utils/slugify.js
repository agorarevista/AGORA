const SlugifyLib = require('slugify');

const slugify = (text) => {
  return SlugifyLib(text, {
    lower: true,
    strict: true,
    locale: 'es',
    trim: true
  });
};

module.exports = { slugify };
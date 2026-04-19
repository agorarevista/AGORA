const store = new Map();

const getCache = (key) => {
  const entry = store.get(key);

  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }

  return entry.value;
};

const setCache = (key, value, ttlMs = 60 * 1000) => {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });

  return value;
};

const deleteCache = (key) => {
  store.delete(key);
};

const clearCache = () => {
  store.clear();
};

module.exports = {
  getCache,
  setCache,
  deleteCache,
  clearCache,
};
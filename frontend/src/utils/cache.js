const DEFAULT_TTL = 30 * 60 * 1000; // 30 minutos

export const cacheSet = (key, data, ttl = DEFAULT_TTL) => {
  const item = { data, expires: Date.now() + ttl };
  localStorage.setItem(`agora_cache_${key}`, JSON.stringify(item));
};

export const cacheGet = (key) => {
  try {
    const raw = localStorage.getItem(`agora_cache_${key}`);
    if (!raw) return null;
    const item = JSON.parse(raw);
    if (Date.now() > item.expires) {
      localStorage.removeItem(`agora_cache_${key}`);
      return null;
    }
    return item.data;
  } catch {
    return null;
  }
};

export const cacheClear = (key) => {
  localStorage.removeItem(`agora_cache_${key}`);
};

export const cacheClearAll = () => {
  Object.keys(localStorage)
    .filter(k => k.startsWith('agora_cache_'))
    .forEach(k => localStorage.removeItem(k));
};
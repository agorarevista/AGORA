import { useState, useEffect } from 'react';
import { cacheGet, cacheSet } from '../utils/cache';

const useCache = (key, fetcher, ttl) => {
  const [data, setData] = useState(() => cacheGet(key));
  const [loading, setLoading] = useState(!cacheGet(key));
  const [error, setError] = useState(null);

  useEffect(() => {
    const cached = cacheGet(key);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetcher()
      .then((result) => {
        cacheSet(key, result, ttl);
        setData(result);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [key]);

  return { data, loading, error };
};

export default useCache;
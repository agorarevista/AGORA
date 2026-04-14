import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Clock } from 'lucide-react';
import { searchArticles } from '../../../api/articles.api';
import { formatDate } from '../../../utils/formatDate';
import styles from './SearchOverlay.module.css';

const HISTORY_KEY = 'agora_search_history';

const getHistory = () => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
};

const saveHistory = (query) => {
  const prev = getHistory().filter(q => q !== query);
  const next = [query, ...prev].slice(0, 6);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
};

export default function SearchOverlay({ open, onClose }) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [history, setHistory]   = useState([]);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (open) {
      setHistory(getHistory());
      setQuery('');
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (query.trim().length < 2) { setResults([]); return; }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await searchArticles(query, { limit: 8 });
        setResults(res.data || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timerRef.current);
  }, [query]);

  const handleSelect = (q) => {
    saveHistory(q);
    setHistory(getHistory());
    onClose();
  };

  const removeHistory = (q, e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = getHistory().filter(h => h !== q);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    setHistory(next);
  };

  const showHistory  = query.trim().length < 2 && history.length > 0;
  const showResults  = query.trim().length >= 2;
  const showEmpty    = showResults && !loading && results.length === 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${open ? styles.backdropOpen : ''}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`${styles.panel} ${open ? styles.panelOpen : ''}`}>
        {/* Input */}
        <div className={styles.inputRow}>
          <Search size={18} className={styles.inputIcon} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar artículos, autores, temas..."
            className={styles.input}
            onKeyDown={e => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && query.trim()) {
                handleSelect(query.trim());
                window.location.href = `/buscar?q=${encodeURIComponent(query.trim())}`;
              }
            }}
          />
          {query && (
            <button className={styles.clearBtn} onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          )}
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Meandro */}
        <div className={styles.meander} />

        {/* Contenido */}
        <div className={styles.results}>

          {/* Historial */}
          {showHistory && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Búsquedas recientes</div>
              {history.map(h => (
                <Link
                  key={h}
                  to={`/buscar?q=${encodeURIComponent(h)}`}
                  className={styles.historyItem}
                  onClick={() => handleSelect(h)}
                >
                  <Clock size={13} className={styles.historyIcon} />
                  <span>{h}</span>
                  <button
                    className={styles.removeHistory}
                    onClick={(e) => removeHistory(h, e)}
                  >
                    <X size={11} />
                  </button>
                </Link>
              ))}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <span>Buscando...</span>
            </div>
          )}

          {/* Sin resultados */}
          {showEmpty && (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>Λ</span>
              <span>Sin resultados para "{query}"</span>
            </div>
          )}

          {/* Resultados */}
          {showResults && results.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                {results.length} resultado{results.length !== 1 ? 's' : ''}
              </div>
              {results.map(art => (
                <Link
                  key={art.id}
                  to={`/articulos/${art.slug}`}
                  className={styles.resultItem}
                  onClick={() => handleSelect(query)}
                >
                  <div className={styles.resultImg}>
                    {art.cover_image_url
                      ? <img src={art.cover_image_url} alt={art.title} />
                      : <span className={styles.resultImgPlaceholder}>Λ</span>
                    }
                  </div>
                  <div className={styles.resultContent}>
                    {art.article_categories?.[0]?.categories && (
                      <span className={styles.resultCategory}>
                        {art.article_categories[0].categories.name}
                      </span>
                    )}
                    <div className={styles.resultTitle}>{art.title}</div>
                    {art.subtitle && (
                      <div className={styles.resultSubtitle}>{art.subtitle}</div>
                    )}
                    <div className={styles.resultMeta}>
                      {art.collaborators && (
                        <span>{art.collaborators.name}</span>
                      )}
                      <span className={styles.dot}>·</span>
                      <span>{formatDate(art.published_at)}</span>
                    </div>
                  </div>
                </Link>
              ))}

              {/* Ver todos */}
              <Link
                to={`/buscar?q=${encodeURIComponent(query)}`}
                className={styles.viewAll}
                onClick={() => handleSelect(query)}
              >
                Ver todos los resultados para "{query}" →
              </Link>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
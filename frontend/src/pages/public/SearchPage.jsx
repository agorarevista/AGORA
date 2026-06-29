import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { searchArticles } from '../../api/articles.api';
import { searchCollaborators } from '../../api/collaborators.api';
import { formatDate } from '../../utils/formatDate';
import { Search, Clock, Eye, X, User } from 'lucide-react';
import styles from './SearchPage.module.css';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';

  const [query, setQuery]           = useState(q);
  const [articles, setArticles]     = useState([]);
  const [collaborators, setCollabs] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [searched, setSearched]     = useState(false);
  const [totalArticles, setTotalArticles] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!q.trim()) { setArticles([]); setCollabs([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);

    Promise.all([
      searchArticles(q, { limit: 20 }).catch(() => ({ data: [], total: 0 })),
      searchCollaborators(q).catch(() => []),
    ]).then(([artRes, collabRes]) => {
      setArticles(artRes.data || []);
      setTotalArticles(artRes.total || 0);
      setCollabs(Array.isArray(collabRes) ? collabRes.slice(0, 6) : []);
    }).finally(() => setLoading(false));
  }, [q]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) setSearchParams({ q: query.trim() });
  };

  const clearSearch = () => {
    setQuery('');
    setSearchParams({});
    setArticles([]);
    setCollabs([]);
    setSearched(false);
    inputRef.current?.focus();
  };

  const totalResults = totalArticles + collaborators.length;

  return (
    <div className={styles.page}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroLabel}>Búsqueda</div>
          <h1 className={styles.heroTitle}>¿Qué estás buscando?</h1>

          <form onSubmit={handleSubmit} className={styles.searchForm}>
            <div className={styles.searchBox}>
              <Search size={20} className={styles.searchIcon} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Escribe un título, autor, tema..."
                className={styles.searchInput}
                autoComplete="off"
              />
              {query && (
                <button type="button" onClick={clearSearch} className={styles.clearBtn}>
                  <X size={16} />
                </button>
              )}
            </div>
            <button type="submit" className={styles.searchBtn}>Buscar</button>
          </form>

          {q && !loading && searched && (
            <div className={styles.resultSummary}>
              {totalResults > 0
                ? <><strong>{totalResults}</strong> resultado{totalResults !== 1 ? 's' : ''} para <em>"{q}"</em></>
                : <>Sin resultados para <em>"{q}"</em></>
              }
            </div>
          )}
        </div>
      </div>

      <div className={styles.meander} />

      {/* ── Resultados ───────────────────────────────────── */}
      <div className={styles.body}>
        {loading ? (
          <SearchSkeleton />
        ) : !searched ? (
          <SearchEmpty />
        ) : totalResults === 0 ? (
          <NoResults query={q} />
        ) : (
          <>
            {/* Colaboradores */}
            {collaborators.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>
                  <User size={14} />
                  Colaboradores
                  <span className={styles.sectionCount}>{collaborators.length}</span>
                </div>
                <div className={styles.collabGrid}>
                  {collaborators.map((col, i) => (
                    <motion.div
                      key={col.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link to={`/colaborador/${col.slug || col.id}`} className={styles.collabCard}>
                        <div className={styles.collabAvatar}>
                          {col.photo_url
                            ? <img src={col.photo_url} alt={col.name} />
                            : <span>{(col.name || '?')[0].toUpperCase()}</span>
                          }
                        </div>
                        <div className={styles.collabInfo}>
                          <div className={styles.collabName}>{col.name}</div>
                          {col.section_name && (
                            <div className={styles.collabSection}>{col.section_name}</div>
                          )}
                          {col.bio && (
                            <div className={styles.collabBio}>{col.bio}</div>
                          )}
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Artículos */}
            {articles.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>
                  Artículos
                  <span className={styles.sectionCount}>{totalArticles}</span>
                </div>
                <div className={styles.results}>
                  {articles.map((art, i) => (
                    <motion.div
                      key={art.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i, 8) * 0.04 }}
                    >
                      <Link to={`/articulos/${art.slug}`} className={styles.resultCard}>
                        {art.cover_image_url && (
                          <div className={styles.resultImg}>
                            <img src={art.cover_image_url} alt={art.title} />
                          </div>
                        )}
                        <div className={styles.resultBody}>
                          <div className={styles.resultTop}>
                            {art.article_categories?.[0]?.categories && (
                              <span className={styles.cat}>
                                {art.article_categories[0].categories.name}
                              </span>
                            )}
                            {art.editions && (
                              <span className={styles.edition}>Ed. #{art.editions.number}</span>
                            )}
                          </div>
                          <h3 className={styles.resultTitle}>{art.title}</h3>
                          {art.subtitle && <p className={styles.resultSubtitle}>{art.subtitle}</p>}
                          {art.excerpt  && <p className={styles.resultExcerpt}>{art.excerpt}</p>}
                          <div className={styles.resultMeta}>
                            {art.collaborators && (
                              <span className={styles.resultAuthor}>{art.collaborators.name}</span>
                            )}
                            <span className={styles.dot}>·</span>
                            <span>{formatDate(art.published_at)}</span>
                            {art.reading_time && (
                              <><span className={styles.dot}>·</span><Clock size={11}/><span>{art.reading_time} min</span></>
                            )}
                            {art.views > 0 && (
                              <><span className={styles.dot}>·</span><Eye size={11}/><span>{art.views}</span></>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SearchEmpty() {
  const SUGGESTIONS = ['Literatura', 'Arte', 'Cultura', 'Poesía', 'Cine', 'Ensayo'];
  const [, setSearchParams] = useSearchParams();
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptySymbol}>Λ</div>
      <h3>Explora Agorá Revista</h3>
      <p>Busca artículos, autores o temas de tu interés</p>
      <div className={styles.suggestions}>
        <div className={styles.suggestLabel}>Sugerencias:</div>
        <div className={styles.suggestTags}>
          {SUGGESTIONS.map(s => (
            <button key={s} className={styles.suggestTag} onClick={() => setSearchParams({ q: s })}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function NoResults({ query }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptySymbol}>Ω</div>
      <h3>Sin resultados para "{query}"</h3>
      <p>Intenta con otro término, un autor o una sección.</p>
      <Link to="/" className={styles.homeLink}>Volver al inicio →</Link>
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className={styles.skeleton}>
      {[1,2,3,4,5].map(i => <div key={i} className={styles.skeletonCard} />)}
    </div>
  );
}   
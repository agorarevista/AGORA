import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Clock, User } from 'lucide-react';
import { searchArticles } from '../../../api/articles.api';
import { searchCollaborators } from '../../../api/collaborators.api';
import { getGalleries } from '../../../api/galleries.api';
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
  const [query, setQuery]         = useState('');
  const [articles, setArticles]   = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [collabs, setCollabs]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [history, setHistory]     = useState([]);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (open) {
      setHistory(getHistory());
      setQuery('');
      setArticles([]);
      setGalleries([]);
      setCollabs([]);

      setTimeout(
        () => inputRef.current?.focus(),
        100
      );
    }
  }, [open]);

  useEffect(() => {
    clearTimeout(
      timerRef.current
    );

    const normalizedQuery =
      query
        .trim()
        .toLocaleLowerCase(
          'es-MX'
        );

    if (
      normalizedQuery.length < 2
    ) {
      setArticles([]);
      setGalleries([]);
      setCollabs([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);

    timerRef.current =
      setTimeout(
        async () => {
          try {
            const [
              artRes,
              galleryRes,
              collabRes,
            ] = await Promise.all([
              searchArticles(
                query,
                {
                  limit: 8,
                }
              ).catch(
                () => ({
                  data: [],
                })
              ),

              getGalleries({
                page: 1,
                limit: 100,
              }).catch(
                () => ({
                  data: [],
                })
              ),

              searchCollaborators(
                query
              ).catch(
                () => []
              ),
            ]);

            const articleResults =
              Array.isArray(
                artRes?.data
              )
                ? artRes.data
                : [];

            const galleryList =
              Array.isArray(
                galleryRes?.data
              )
                ? galleryRes.data
                : Array.isArray(
                      galleryRes
                    )
                  ? galleryRes
                  : [];

            const galleryResults =
              galleryList
                .filter(
                  gallery => {
                    const title =
                      String(
                        gallery?.title ||
                        ''
                      )
                        .toLocaleLowerCase(
                          'es-MX'
                        );

                    const subtitle =
                      String(
                        gallery?.subtitle ||
                        ''
                      )
                        .toLocaleLowerCase(
                          'es-MX'
                        );

                    const collaboratorName =
                      String(
                        gallery
                          ?.collaborators
                          ?.name ||
                        gallery
                          ?.collaborator
                          ?.name ||
                        ''
                      )
                        .toLocaleLowerCase(
                          'es-MX'
                        );

                    return (
                      title.includes(
                        normalizedQuery
                      ) ||
                      subtitle.includes(
                        normalizedQuery
                      ) ||
                      collaboratorName.includes(
                        normalizedQuery
                      )
                    );
                  }
                )
                .slice(0, 8);

            setArticles(
              articleResults
            );

            setGalleries(
              galleryResults
            );

            setCollabs(
              Array.isArray(
                collabRes
              )
                ? collabRes.slice(
                    0,
                    3
                  )
                : []
            );
          } catch (error) {
            console.error(
              'Error buscando contenido:',
              error
            );

            setArticles([]);
            setGalleries([]);
            setCollabs([]);
          } finally {
            setLoading(false);
          }
        },
        350
      );

    return () => {
      clearTimeout(
        timerRef.current
      );
    };
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

  const showHistory =
    query.trim().length < 2 &&
    history.length > 0;

  const showResults =
    query.trim().length >= 2;

  const hasResults =
    articles.length > 0 ||
    galleries.length > 0 ||
    collabs.length > 0;

  const showEmpty =
    showResults &&
    !loading &&
    !hasResults;

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
                  <button className={styles.removeHistory} onClick={(e) => removeHistory(h, e)}>
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

          {/* Colaboradores */}
          {showResults && collabs.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <User size={12} style={{ opacity: 0.6 }} />
                Colaboradores
              </div>
              {collabs.map(col => (
                <Link
                  key={col.id}
                  to={`/colaborador/${col.slug || col.id}`}
                  className={styles.collabItem}
                  onClick={() => handleSelect(query)}
                >
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
                  </div>
                </Link>
              ))}
            </div>
          )}
          {/* Álbumes fotográficos */}
          {showResults &&
            galleries.length > 0 && (
            <div className={styles.section}>
              <div
                className={
                  styles.sectionTitle
                }
              >
                Álbumes fotográficos
              </div>

              {galleries.map(
                gallery => {
                  const authorName =
                    gallery
                      ?.collaborators
                      ?.name ||
                    gallery
                      ?.collaborator
                      ?.name ||
                    'Agorá Revista';

                  return (
                    <Link
                      key={`gallery-${gallery.id}`}
                      to={`/galeria/${gallery.slug}`}
                      className={
                        styles.resultItem
                      }
                      onClick={() =>
                        handleSelect(
                          query
                        )
                      }
                    >
                      <div
                        className={
                          styles.resultImg
                        }
                      >
                        {gallery.cover_image_url ? (
                          <img
                            src={
                              gallery
                                .cover_image_url
                            }
                            alt={
                              gallery.title
                            }
                          />
                        ) : (
                          <span
                            className={
                              styles.resultImgPlaceholder
                            }
                          >
                            Λ
                          </span>
                        )}
                      </div>

                      <div
                        className={
                          styles.resultContent
                        }
                      >
                        <span
                          className={
                            styles.resultCategory
                          }
                        >
                          Álbum fotográfico
                        </span>

                        <div
                          className={
                            styles.resultTitle
                          }
                        >
                          {gallery.title}
                        </div>

                        {gallery.subtitle && (
                          <div
                            className={
                              styles.resultSubtitle
                            }
                          >
                            {
                              gallery.subtitle
                            }
                          </div>
                        )}

                        <div
                          className={
                            styles.resultMeta
                          }
                        >
                          <span>
                            {authorName}
                          </span>

                          <span
                            className={
                              styles.dot
                            }
                          >
                            ·
                          </span>

                          <span>
                            {formatDate(
                              gallery.published_at ||
                              gallery.created_at
                            )}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                }
              )}
            </div>
          )}


          {/* Artículos */}
          {showResults && articles.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                Artículos y contenido
              </div>
              {articles.map(art => (
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
                      {art.collaborators && <span>{art.collaborators.name}</span>}
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
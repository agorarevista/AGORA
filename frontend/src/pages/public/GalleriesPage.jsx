import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Link,
} from 'react-router-dom';

import {
  motion,
} from 'framer-motion';

import {
  ArrowLeft,
  Check,
  ChevronDown,
  Images,
  Search,
  X,
} from 'lucide-react';

import {
  getGalleries,
} from '../../api/galleries.api';

import {
  formatDate,
} from '../../utils/formatDate';

import styles from './GalleriesPage.module.css';

const LIMIT = 100;

const getGalleryAuthor = gallery => {
  return (
    gallery?.collaborators ||
    gallery?.collaborator ||
    null
  );
};

const getGalleryAuthorId = gallery => {
  const author =
    getGalleryAuthor(gallery);

  return (
    author?.id ||
    gallery?.collaborator_id ||
    null
  );
};

const getGalleryAuthorName = gallery => {
  const author =
    getGalleryAuthor(gallery);

  return (
    author?.name ||
    'Agorá Revista'
  );
};

export default function GalleriesPage() {
  const [
    galleries,
    setGalleries,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState('');

  const [
    searchTerm,
    setSearchTerm,
  ] = useState('');

  const [
    sortOrder,
    setSortOrder,
  ] = useState('az');

  const [
    selectedAuthors,
    setSelectedAuthors,
  ] = useState([]);

  const [
    authorsOpen,
    setAuthorsOpen,
  ] = useState(false);

  const authorsDropdownRef =
    useRef(null);

  useEffect(() => {
    let mounted = true;

    const loadGalleries =
      async () => {
        setLoading(true);
        setLoadError('');

        try {
          const response =
            await getGalleries({
              page: 1,
              limit: LIMIT,
            });

          if (!mounted) {
            return;
          }

          const galleryList =
            Array.isArray(
              response?.data
            )
              ? response.data
              : Array.isArray(
                    response
                  )
                ? response
                : [];

          setGalleries(
            galleryList
          );
        } catch (error) {
          console.error(
            'ERROR cargando galerías:',
            error
          );

          if (mounted) {
            setLoadError(
              error?.response
                ?.data?.error ||
              error?.response
                ?.data?.message ||
              'No fue posible cargar las galerías.'
            );
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    loadGalleries();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'auto',
    });
  }, []);

  useEffect(() => {
    const handleOutsideClick =
      event => {
        if (
          authorsDropdownRef
            .current &&
          !authorsDropdownRef
            .current
            .contains(
              event.target
            )
        ) {
          setAuthorsOpen(
            false
          );
        }
      };

    const handleEscape =
      event => {
        if (
          event.key ===
          'Escape'
        ) {
          setAuthorsOpen(
            false
          );
        }
      };

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    );

    document.addEventListener(
      'keydown',
      handleEscape
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      );

      document.removeEventListener(
        'keydown',
        handleEscape
      );
    };
  }, []);

  const authors =
    useMemo(() => {
      const authorMap =
        new Map();

      galleries.forEach(
        gallery => {
          const author =
            getGalleryAuthor(
              gallery
            );

          const authorId =
            getGalleryAuthorId(
              gallery
            );

          if (
            !authorId ||
            !author?.name
          ) {
            return;
          }

          if (
            !authorMap.has(
              authorId
            )
          ) {
            authorMap.set(
              authorId,
              {
                id: authorId,
                name:
                  author.name,
              }
            );
          }
        }
      );

      return Array.from(
        authorMap.values()
      ).sort(
        (
          firstAuthor,
          secondAuthor
        ) => {
          return firstAuthor.name
            .localeCompare(
              secondAuthor.name,
              'es',
              {
                sensitivity:
                  'base',
              }
            );
        }
      );
    }, [galleries]);

  const filteredGalleries =
    useMemo(() => {
      const normalizedSearch =
        searchTerm
          .trim()
          .toLocaleLowerCase(
            'es-MX'
          );

      const filtered =
        galleries.filter(
          gallery => {
            const title =
              String(
                gallery.title ||
                ''
              ).toLocaleLowerCase(
                'es-MX'
              );

            const subtitle =
              String(
                gallery.subtitle ||
                ''
              ).toLocaleLowerCase(
                'es-MX'
              );

            const authorName =
              getGalleryAuthorName(
                gallery
              ).toLocaleLowerCase(
                'es-MX'
              );

            const authorId =
              getGalleryAuthorId(
                gallery
              );

            const matchesSearch =
              !normalizedSearch ||
              title.includes(
                normalizedSearch
              ) ||
              subtitle.includes(
                normalizedSearch
              ) ||
              authorName.includes(
                normalizedSearch
              );

            const matchesAuthors =
              selectedAuthors
                .length === 0 ||
              selectedAuthors.includes(
                authorId
              );

            return (
              matchesSearch &&
              matchesAuthors
            );
          }
        );

      return [
        ...filtered,
      ].sort(
        (
          firstGallery,
          secondGallery
        ) => {
          const comparison =
            String(
              firstGallery.title ||
              ''
            ).localeCompare(
              String(
                secondGallery.title ||
                ''
              ),
              'es',
              {
                sensitivity:
                  'base',
              }
            );

          return sortOrder ===
            'za'
            ? comparison * -1
            : comparison;
        }
      );
    }, [
      galleries,
      searchTerm,
      selectedAuthors,
      sortOrder,
    ]);

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedAuthors.length > 0 ||
    sortOrder !== 'az';

  const toggleAuthor =
    authorId => {
      setSelectedAuthors(
        currentAuthors =>
          currentAuthors.includes(
            authorId
          )
            ? currentAuthors.filter(
                currentId =>
                  currentId !==
                  authorId
              )
            : [
                ...currentAuthors,
                authorId,
              ]
      );
    };

  const clearFilters =
    () => {
      setSearchTerm('');
      setSortOrder('az');
      setSelectedAuthors([]);
      setAuthorsOpen(false);
    };

  return (
    <main
      className={
        styles.page
      }
    >
      <header
        className={
          styles.hero
        }
      >
        <div
          className={
            styles.heroInner
          }
        >
          <Link
            to="/"
            className={
              styles.backLink
            }
          >
            <ArrowLeft
              size={14}
            />

            Inicio
          </Link>

          <div
            className={
              styles.eyebrow
            }
          >
            <span />

            Sección
          </div>

          <h1>
            Galería
          </h1>

          <p
            className={
              styles.introduction
            }
          >
            Álbumes fotográficos,
            miradas y recorridos
            visuales de Agorá.
          </p>
        </div>
      </header>

      <section
        className={
          styles.content
        }
      >
        {!loading &&
          !loadError &&
          galleries.length >
            0 && (
            <div
              className={
                styles.filtersSection
              }
            >
              <div
                className={
                  styles.filtersHeader
                }
              >
                <div>
                  <span
                    className={
                      styles.filtersEyebrow
                    }
                  >
                    Explorar galerías
                  </span>

                  <h2
                    className={
                      styles.filtersTitle
                    }
                  >
                    Encuentra una mirada
                  </h2>
                </div>

                <span
                  className={
                    styles.resultsCount
                  }
                >
                  {
                    filteredGalleries.length
                  }{' '}
                  {filteredGalleries
                    .length === 1
                    ? 'resultado'
                    : 'resultados'}
                </span>
              </div>

              <div
                className={
                  styles.filtersBar
                }
              >
                <div
                  className={
                    styles.searchControl
                  }
                >
                  <Search
                    size={18}
                    className={
                      styles.searchIcon
                    }
                  />

                  <input
                    type="search"
                    value={
                      searchTerm
                    }
                    onChange={event => {
                      setSearchTerm(
                        event.target
                          .value
                      );
                    }}
                    className={
                      styles.searchInput
                    }
                    placeholder="Buscar por álbum o autor..."
                    aria-label="Buscar álbum o autor"
                  />

                  {searchTerm && (
                    <button
                      type="button"
                      className={
                        styles.clearSearchButton
                      }
                      onClick={() => {
                        setSearchTerm(
                          ''
                        );
                      }}
                      aria-label="Limpiar búsqueda"
                    >
                      <X
                        size={16}
                      />
                    </button>
                  )}
                </div>

                <div
                  className={
                    styles.sortControl
                  }
                >
                  <label
                    htmlFor="gallery-sort"
                    className={
                      styles.filterLabel
                    }
                  >
                    Orden
                  </label>

                  <select
                    id="gallery-sort"
                    value={
                      sortOrder
                    }
                    onChange={event => {
                      setSortOrder(
                        event.target
                          .value
                      );
                    }}
                    className={
                      styles.sortSelect
                    }
                  >
                    <option value="az">
                      A–Z
                    </option>

                    <option value="za">
                      Z–A
                    </option>
                  </select>
                </div>

                <div
                  className={
                    styles.authorsControl
                  }
                  ref={
                    authorsDropdownRef
                  }
                >
                  <span
                    className={
                      styles.filterLabel
                    }
                  >
                    Autores
                  </span>

                  <button
                    type="button"
                    className={`${styles.authorsButton} ${
                      authorsOpen
                        ? styles.authorsButtonOpen
                        : ''
                    }`}
                    onClick={() => {
                      setAuthorsOpen(
                        currentState =>
                          !currentState
                      );
                    }}
                    aria-expanded={
                      authorsOpen
                    }
                    aria-haspopup="listbox"
                  >
                    <span
                      className={
                        styles.authorsButtonText
                      }
                    >
                      {selectedAuthors
                        .length === 0
                        ? 'Todos los autores'
                        : `${selectedAuthors.length} ${
                            selectedAuthors.length ===
                            1
                              ? 'autor seleccionado'
                              : 'autores seleccionados'
                          }`}
                    </span>

                    <ChevronDown
                      size={16}
                      className={`${styles.authorsChevron} ${
                        authorsOpen
                          ? styles.authorsChevronOpen
                          : ''
                      }`}
                    />
                  </button>

                  {authorsOpen && (
                    <div
                      className={
                        styles.authorsDropdown
                      }
                      role="listbox"
                      aria-multiselectable="true"
                    >
                      <div
                        className={
                          styles.authorsDropdownHeader
                        }
                      >
                        <span>
                          Filtrar por autores
                        </span>

                        {selectedAuthors
                          .length >
                          0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAuthors(
                                []
                              );
                            }}
                          >
                            Limpiar
                          </button>
                        )}
                      </div>

                      <div
                        className={
                          styles.authorsOptions
                        }
                      >
                        {authors.map(
                          author => {
                            const isSelected =
                              selectedAuthors.includes(
                                author.id
                              );

                            return (
                              <button
                                key={
                                  author.id
                                }
                                type="button"
                                className={`${styles.authorOption} ${
                                  isSelected
                                    ? styles.authorOptionSelected
                                    : ''
                                }`}
                                onClick={() => {
                                  toggleAuthor(
                                    author.id
                                  );
                                }}
                                role="option"
                                aria-selected={
                                  isSelected
                                }
                              >
                                <span
                                  className={
                                    styles.authorCheckbox
                                  }
                                >
                                  {isSelected && (
                                    <Check
                                      size={
                                        13
                                      }
                                    />
                                  )}
                                </span>

                                <span>
                                  {
                                    author.name
                                  }
                                </span>
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    className={
                      styles.clearFiltersButton
                    }
                    onClick={
                      clearFilters
                    }
                  >
                    <X
                      size={15}
                    />

                    Limpiar filtros
                  </button>
                )}
              </div>

              {selectedAuthors.length >
                0 && (
                <div
                  className={
                    styles.selectedAuthors
                  }
                >
                  {selectedAuthors.map(
                    authorId => {
                      const author =
                        authors.find(
                          currentAuthor =>
                            currentAuthor.id ===
                            authorId
                        );

                      if (!author) {
                        return null;
                      }

                      return (
                        <button
                          key={
                            author.id
                          }
                          type="button"
                          className={
                            styles.authorTag
                          }
                          onClick={() => {
                            toggleAuthor(
                              author.id
                            );
                          }}
                        >
                          {author.name}

                          <X
                            size={13}
                          />
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          )}

        {loading ? (
          <GallerySkeleton />
        ) : loadError ? (
          <MessageState
            title="No pudimos cargar las galerías"
            message={
              loadError
            }
          />
        ) : galleries.length ===
          0 ? (
          <MessageState
            title="No hay galerías publicadas todavía"
            message="Vuelve pronto, estamos preparando nuevos recorridos visuales."
          />
        ) : filteredGalleries
            .length === 0 ? (
          <div
            className={
              styles.noResults
            }
          >
            <span
              className={
                styles.messageSymbol
              }
            >
              Λ
            </span>

            <h2>
              No encontramos coincidencias
            </h2>

            <p>
              Prueba con otro título,
              nombre de autor o elimina
              alguno de los filtros.
            </p>

            <button
              type="button"
              onClick={
                clearFilters
              }
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <section
            className={
              styles.grid
            }
          >
            {filteredGalleries.map(
              (
                gallery,
                index
              ) => (
                <GalleryCard
                  key={
                    gallery.id
                  }
                  gallery={
                    gallery
                  }
                  index={
                    index
                  }
                />
              )
            )}
          </section>
        )}
      </section>
    </main>
  );
}

function GalleryCard({
  gallery,
  index,
}) {
  const authorName =
    getGalleryAuthorName(
      gallery
    );

  const publicationDate =
    gallery.published_at ||
    gallery.created_at;

  const photosCount =
    gallery.photos_count ??
    gallery.gallery_photos?.length ??
    0;

  return (
    <motion.article
      className={
        styles.card
      }
      initial={{
        opacity: 0,
        y: 24,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.15,
      }}
      transition={{
        duration: 0.44,
        delay:
          Math.min(
            index,
            6
          ) * 0.055,
      }}
    >
      <Link
        to={`/galeria/${gallery.slug}`}
        className={
          styles.cardLink
        }
        aria-label={`Abrir galería ${gallery.title}`}
      >
        <div
          className={
            styles.cardImage
          }
        >
          {gallery.cover_image_url ? (
            <img
              src={
                gallery.cover_image_url
              }
              alt={
                gallery.title
              }
              loading="lazy"
            />
          ) : (
            <div
              className={
                styles.cardPlaceholder
              }
            >
              <Images
                size={42}
              />
            </div>
          )}

          <div
            className={
              styles.cardShade
            }
          />

          <div
            className={
              styles.photoCount
            }
          >
            <Images
              size={14}
            />

            <span>
              {photosCount}
            </span>
          </div>

          <div
            className={
              styles.cardOverlay
            }
          >
            <span
              className={
                styles.cardEyebrow
              }
            >
              Álbum fotográfico
            </span>

            <h2>
              {gallery.title}
            </h2>

            {gallery.subtitle && (
              <p
                className={
                  styles.cardSubtitle
                }
              >
                {gallery.subtitle}
              </p>
            )}

            <div
              className={
                styles.cardMeta
              }
            >
              <span>
                {authorName}
              </span>

              {publicationDate && (
                <>
                  <span
                    aria-hidden="true"
                  >
                    ·
                  </span>

                  <span>
                    {formatDate(
                      publicationDate
                    )}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

function GallerySkeleton() {
  return (
    <div
      className={
        styles.grid
      }
    >
      {[
        1,
        2,
        3,
        4,
        5,
        6,
      ].map(item => (
        <div
          key={item}
          className={
            styles.skeleton
          }
        />
      ))}
    </div>
  );
}

function MessageState({
  title,
  message,
}) {
  return (
    <div
      className={
        styles.messageState
      }
    >
      <span
        className={
          styles.messageSymbol
        }
      >
        Λ
      </span>

      <h2>
        {title}
      </h2>

      <p>
        {message}
      </p>

      <Link to="/">
        ← Volver al inicio
      </Link>
    </div>
  );
}
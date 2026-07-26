import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Check,
  ChevronDown,
  Search,
  X,
} from 'lucide-react';
import { getColumns } from '../../api/categories.api';
import styles from './ColumnsPage.module.css';

export default function ColumnsPage() {
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('az');
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [authorsOpen, setAuthorsOpen] = useState(false);

  const authorsDropdownRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const loadColumns = async () => {
      setLoading(true);
      setLoadError('');

      try {
        const data = await getColumns();

        if (!mounted) {
          return;
        }

        setColumns(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          'ERROR cargando columnas:',
          error
        );

        if (mounted) {
          setLoadError(
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            'No fue posible cargar las columnas.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadColumns();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = event => {
      if (
        authorsDropdownRef.current &&
        !authorsDropdownRef.current.contains(event.target)
      ) {
        setAuthorsOpen(false);
      }
    };

    const handleEscape = event => {
      if (event.key === 'Escape') {
        setAuthorsOpen(false);
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

  const authors = useMemo(() => {
    const authorMap = new Map();

    columns.forEach(column => {
      const author =
        column.fixed_collaborator;

      if (!author?.id || !author?.name) {
        return;
      }

      if (!authorMap.has(author.id)) {
        authorMap.set(author.id, {
          id: author.id,
          name: author.name,
        });
      }
    });

    return Array.from(authorMap.values())
      .sort((firstAuthor, secondAuthor) =>
        firstAuthor.name.localeCompare(
          secondAuthor.name,
          'es',
          {
            sensitivity: 'base',
          }
        )
      );
  }, [columns]);

  const filteredColumns = useMemo(() => {
    const normalizedSearch =
      searchTerm
        .trim()
        .toLocaleLowerCase('es');

    const filtered = columns.filter(column => {
      const author =
        column.fixed_collaborator;

      const columnName =
        String(column.name || '')
          .toLocaleLowerCase('es');

      const authorName =
        String(author?.name || '')
          .toLocaleLowerCase('es');

      const matchesSearch =
        !normalizedSearch ||
        columnName.includes(normalizedSearch) ||
        authorName.includes(normalizedSearch);

      const matchesAuthors =
        selectedAuthors.length === 0 ||
        selectedAuthors.includes(author?.id);

      return (
        matchesSearch &&
        matchesAuthors
      );
    });

    return [...filtered].sort((firstColumn, secondColumn) => {
      const comparison =
        String(firstColumn.name || '')
          .localeCompare(
            String(secondColumn.name || ''),
            'es',
            {
              sensitivity: 'base',
            }
          );

      return sortOrder === 'za'
        ? comparison * -1
        : comparison;
    });
  }, [
    columns,
    searchTerm,
    selectedAuthors,
    sortOrder,
  ]);

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedAuthors.length > 0 ||
    sortOrder !== 'az';

  const toggleAuthor = authorId => {
    setSelectedAuthors(currentAuthors =>
      currentAuthors.includes(authorId)
        ? currentAuthors.filter(
            currentId =>
              currentId !== authorId
          )
        : [
            ...currentAuthors,
            authorId,
          ]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSortOrder('az');
    setSelectedAuthors([]);
    setAuthorsOpen(false);
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <motion.div
          className={styles.heroContent}
          initial={{
            opacity: 0,
            y: 22,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.52,
          }}
        >
          <span className={styles.heroEyebrow}>
            Nuestras voces
          </span>

          <h1 className={styles.heroTitle}>
            Columnas
          </h1>

          <p className={styles.heroDescription}>
            Una selección de voces permanentes, miradas críticas
            y espacios editoriales construidos por nuestros
            colaboradores.
          </p>
        </motion.div>
      </section>

      <section className={styles.columnsSection}>
        {!loading && !loadError && columns.length > 0 && (
          <div className={styles.filtersSection}>
            <div className={styles.filtersHeader}>
              <div>
                <span className={styles.filtersEyebrow}>
                  Explorar columnas
                </span>

                <h2 className={styles.filtersTitle}>
                  Encuentra una voz
                </h2>
              </div>

              <span className={styles.resultsCount}>
                {filteredColumns.length}{' '}
                {filteredColumns.length === 1
                  ? 'resultado'
                  : 'resultados'}
              </span>
            </div>

            <div className={styles.filtersBar}>
              <div className={styles.searchControl}>
                <Search
                  size={18}
                  className={styles.searchIcon}
                />

                <input
                  type="search"
                  value={searchTerm}
                  onChange={event =>
                    setSearchTerm(
                      event.target.value
                    )
                  }
                  className={styles.searchInput}
                  placeholder="Buscar por columna o autor..."
                  aria-label="Buscar columna o autor"
                />

                {searchTerm && (
                  <button
                    type="button"
                    className={styles.clearSearchButton}
                    onClick={() =>
                      setSearchTerm('')
                    }
                    aria-label="Limpiar búsqueda"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className={styles.sortControl}>
                <label
                  htmlFor="columns-sort"
                  className={styles.filterLabel}
                >
                  Orden
                </label>

                <select
                  id="columns-sort"
                  value={sortOrder}
                  onChange={event =>
                    setSortOrder(
                      event.target.value
                    )
                  }
                  className={styles.sortSelect}
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
                className={styles.authorsControl}
                ref={authorsDropdownRef}
              >
                <span className={styles.filterLabel}>
                  Autores
                </span>

                <button
                  type="button"
                  className={`${styles.authorsButton} ${
                    authorsOpen
                      ? styles.authorsButtonOpen
                      : ''
                  }`}
                  onClick={() =>
                    setAuthorsOpen(
                      currentState =>
                        !currentState
                    )
                  }
                  aria-expanded={authorsOpen}
                  aria-haspopup="listbox"
                >
                  <span className={styles.authorsButtonText}>
                    {selectedAuthors.length === 0
                      ? 'Todos los autores'
                      : `${selectedAuthors.length} ${
                          selectedAuthors.length === 1
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
                    className={styles.authorsDropdown}
                    role="listbox"
                    aria-multiselectable="true"
                  >
                    <div className={styles.authorsDropdownHeader}>
                      <span>
                        Filtrar por autores
                      </span>

                      {selectedAuthors.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedAuthors([])
                          }
                        >
                          Limpiar
                        </button>
                      )}
                    </div>

                    <div className={styles.authorsOptions}>
                      {authors.map(author => {
                        const isSelected =
                          selectedAuthors.includes(
                            author.id
                          );

                        return (
                          <button
                            key={author.id}
                            type="button"
                            className={`${styles.authorOption} ${
                              isSelected
                                ? styles.authorOptionSelected
                                : ''
                            }`}
                            onClick={() =>
                              toggleAuthor(
                                author.id
                              )
                            }
                            role="option"
                            aria-selected={isSelected}
                          >
                            <span
                              className={
                                styles.authorCheckbox
                              }
                            >
                              {isSelected && (
                                <Check size={13} />
                              )}
                            </span>

                            <span>
                              {author.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  className={styles.clearFiltersButton}
                  onClick={clearFilters}
                >
                  <X size={15} />
                  Limpiar filtros
                </button>
              )}
            </div>

            {selectedAuthors.length > 0 && (
              <div className={styles.selectedAuthors}>
                {selectedAuthors.map(authorId => {
                  const author =
                    authors.find(
                      currentAuthor =>
                        currentAuthor.id === authorId
                    );

                  if (!author) {
                    return null;
                  }

                  return (
                    <button
                      key={author.id}
                      type="button"
                      className={styles.authorTag}
                      onClick={() =>
                        toggleAuthor(author.id)
                      }
                    >
                      {author.name}
                      <X size={13} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <ColumnsSkeleton />
        ) : loadError ? (
          <div className={styles.messageState}>
            <span className={styles.messageSymbol}>
              Λ
            </span>

            <h2>No pudimos cargar las columnas</h2>

            <p>{loadError}</p>
          </div>
        ) : columns.length === 0 ? (
          <div className={styles.messageState}>
            <span className={styles.messageSymbol}>
              Λ
            </span>

            <h2>Próximamente</h2>

            <p>
              Las columnas fijas aparecerán aquí cuando tengan
              un autor y un banner asignados.
            </p>
          </div>
        ) : filteredColumns.length === 0 ? (
          <div className={styles.emptyResults}>
            <span
              className={styles.emptyResultsSymbol}
              aria-hidden="true"
            >
              Λ
            </span>

            <h2 className={styles.emptyResultsTitle}>
              No encontramos coincidencias
            </h2>

            <p className={styles.emptyResultsText}>
              Prueba con otro nombre de columna,
              autor o elimina alguno de los filtros.
            </p>

            <button
              type="button"
              className={styles.emptyResultsButton}
              onClick={clearFilters}
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className={styles.columnsList}>
            {filteredColumns.map(
              (column, index) => (
                <ColumnBanner
                  key={column.id}
                  column={column}
                  index={index}
                />
              )
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function ColumnBanner({
  column,
  index,
}) {
  const author =
    column.fixed_collaborator || null;

  const bannerStyle =
    column.cover_image_url
      ? {
          backgroundImage:
            `url("${column.cover_image_url}")`,
        }
      : undefined;

  return (
    <motion.article
      className={styles.columnBanner}
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
        amount: 0.18,
      }}
      transition={{
        delay:
          Math.min(index, 4) * 0.06,
        duration: 0.48,
      }}
    >
      <Link
        to={`/categoria/${column.slug}`}
        className={styles.columnBannerLink}
        aria-label={`Abrir columna ${column.name}`}
      >
        <div
          className={styles.columnBannerImage}
          style={bannerStyle}
        />

        <div className={styles.columnBannerShade} />

        <div className={styles.columnBannerFrame} />

        <div className={styles.columnBannerContent}>
          <span className={styles.columnNumber}>
            {toRoman(index + 1)}
          </span>

          <div className={styles.columnMain}>
            <span className={styles.columnEyebrow}>
              Columna fija
            </span>

            <h2 className={styles.columnTitle}>
              {column.name}
            </h2>

            {column.description && (
              <p className={styles.columnDescription}>
                {column.description}
              </p>
            )}

            {author && (
              <div className={styles.columnFooter}>
                <div className={styles.columnAuthor}>
                  {author.photo_url ? (
                    <img
                      src={author.photo_url}
                      alt={author.name}
                      className={styles.columnAuthorPhoto}
                    />
                  ) : (
                    <div
                      className={
                        styles.columnAuthorPlaceholder
                      }
                    >
                      {(author.name || '?')[0].toUpperCase()}
                    </div>
                  )}

                  <div>
                    <span className={styles.columnAuthorLabel}>
                      Por
                    </span>

                    <strong className={styles.columnAuthorName}>
                      {author.name}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

function toRoman(number) {
  const romanValues = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];

  let remainingNumber = number;
  let result = '';

  romanValues.forEach(
    ([value, symbol]) => {
      while (
        remainingNumber >= value
      ) {
        result += symbol;
        remainingNumber -= value;
      }
    }
  );

  return result;
}

function ColumnsSkeleton() {
  return (
    <div className={styles.columnsList}>
      {[1, 2, 3].map(item => (
        <div
          key={item}
          className={styles.skeletonBanner}
        />
      ))}
    </div>
  );
}
import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import {
  motion,
} from 'framer-motion';

import {
  Archive,
  ChevronDown,
  ChevronRight,
  Edit,
  Eye,
  FileImage,
  Filter,
  FolderOpen,
  Images,
  Plus,
  Search,
  Send,
  Trash2,
} from 'lucide-react';

import {
  archiveGallery,
  deleteGalleryPermanently,
  getAdminGalleries,
  publishGallery,
} from '../../api/galleries.api';

import {
  getEditions,
} from '../../api/editions.api';

import {
  formatDate,
} from '../../utils/formatDate';

import useAlert from '../../hooks/useAlert';
import useConfirm from '../../hooks/useConfirm';

import styles from './GalleriesPage.module.css';

const LIMIT = 100;

const STATUS_LABELS = {
  draft: {
    label: 'Borrador',
    color: '#92400e',
    background: '#fef3c7',
  },

  published: {
    label: 'Publicada',
    color: '#065f46',
    background: '#d1fae5',
  },

  archived: {
    label: 'Archivada',
    color: '#6b7280',
    background: '#f3f4f6',
  },
};

export default function GalleriesPage() {
  const navigate =
    useNavigate();

  const alert =
    useAlert();

  const confirm =
    useConfirm();

  const [
    galleries,
    setGalleries,
  ] = useState([]);

  const [
    editions,
    setEditions,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('all');

  const [
    editionFilter,
    setEditionFilter,
  ] = useState('all');

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    total,
    setTotal,
  ] = useState(0);

  const [
    processingId,
    setProcessingId,
  ] = useState(null);

  const [
    openFolders,
    setOpenFolders,
  ] = useState({});

  const loadGalleries =
    async () => {
      setLoading(true);

      try {
        const [
          galleryResponse,
          editionResponse,
        ] =
          await Promise.all([
            getAdminGalleries({
              page,

              limit:
                LIMIT,

              status:
                statusFilter,

              edition_id:
                editionFilter,
            }),

            getEditions(),
          ]);

        const galleryList =
          Array.isArray(
            galleryResponse
              ?.data
          )
            ? galleryResponse.data
            : Array.isArray(
                galleryResponse
              )
              ? galleryResponse
              : [];

        const editionList =
          Array.isArray(
            editionResponse
          )
            ? editionResponse
            : Array.isArray(
                editionResponse
                  ?.data
              )
              ? editionResponse.data
              : [];

        setGalleries(
          galleryList
        );

        setEditions(
          editionList
        );

        setTotal(
          Number(
            galleryResponse
              ?.total ||
            galleryList.length ||
            0
          )
        );
      } catch (error) {
        console.error(
          'ERROR cargando galerías y ediciones:',
          error
        );

        alert.error(
          'Error',
          error?.response
            ?.data
            ?.error ||
          error?.response
            ?.data
            ?.message ||
          'No se pudieron cargar las galerías'
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadGalleries();
  }, [
    page,
    statusFilter,
    editionFilter,
  ]);

  const filteredGalleries =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLocaleLowerCase(
            'es-MX'
          );

      if (!normalizedSearch) {
        return galleries;
      }

      return galleries.filter(
        gallery => {
          const title =
            String(
              gallery.title || ''
            )
              .toLocaleLowerCase(
                'es-MX'
              );

const author =
  String(
    gallery
      .collaborators
      ?.name || ''
  )
    .toLocaleLowerCase(
      'es-MX'
    );

const editionName =
  String(
    gallery
      .editions
      ?.name || ''
  )
    .toLocaleLowerCase(
      'es-MX'
    );

const editionNumber =
  String(
    gallery
      .editions
      ?.number || ''
  )
    .toLocaleLowerCase(
      'es-MX'
    );

return (
  title.includes(
    normalizedSearch
  ) ||
  author.includes(
    normalizedSearch
  ) ||
  editionName.includes(
    normalizedSearch
  ) ||
  editionNumber.includes(
    normalizedSearch
  )
);
        }
      );
    }, [
      galleries,
      search,
    ]);

  const groupedGalleries =
    useMemo(() => {
      const visibleEditions =
        editionFilter === 'all'
          ? [...editions]
          : editionFilter ===
              'without-edition'
            ? []
            : editions.filter(
                edition =>
                  String(
                    edition.id
                  ) ===
                  String(
                    editionFilter
                  )
              );

      const editionGroups =
        visibleEditions
          .sort(
            (
              firstEdition,
              secondEdition
            ) => {
              const firstIsCurrent =
                Boolean(
                  firstEdition
                    .is_current
                );

              const secondIsCurrent =
                Boolean(
                  secondEdition
                    .is_current
                );

              if (
                firstIsCurrent !==
                secondIsCurrent
              ) {
                return firstIsCurrent
                  ? -1
                  : 1;
              }

              return (
                Number(
                  secondEdition
                    .number ||
                  0
                ) -
                Number(
                  firstEdition
                    .number ||
                  0
                )
              );
            }
          )
          .map(
            edition => {
              const editionGalleries =
                filteredGalleries.filter(
                  gallery => {
                    const galleryEditionId =
                      gallery
                        .edition_id ||
                      gallery
                        .editions
                        ?.id ||
                      null;

                    return (
                      String(
                        galleryEditionId
                      ) ===
                      String(
                        edition.id
                      )
                    );
                  }
                );

              return {
                key:
                  String(
                    edition.id
                  ),

                edition,

                galleries:
                  editionGalleries,
              };
            }
          );

      const galleriesWithoutEdition =
        filteredGalleries.filter(
          gallery =>
            !gallery
              .edition_id &&
            !gallery
              .editions
              ?.id
        );

      if (
        editionFilter !== 'all' &&
        editionFilter !==
          'without-edition'
      ) {
        return editionGroups;
      }

      return [
        ...editionGroups,

        {
          key:
            'without-edition',

          edition:
            null,

          galleries:
            galleriesWithoutEdition,
        },
      ];
    }, [
      filteredGalleries,
      editions,
      editionFilter,
    ]);

  useEffect(() => {
    setOpenFolders(
      current => {
        const next = {
          ...current,
        };

        groupedGalleries.forEach(
          (
            group,
            index
          ) => {
            if (
              Object.prototype
                .hasOwnProperty
                .call(
                  next,
                  group.key
                )
            ) {
              return;
            }

            next[group.key] =
              Boolean(
                group.edition
                  ?.is_current
              ) ||
              index === 0;
          }
        );

        return next;
      }
    );
  }, [
    groupedGalleries,
  ]);

  const toggleFolder =
    folderKey => {
      setOpenFolders(
        current => ({
          ...current,

          [folderKey]:
            !current[
              folderKey
            ],
        })
      );
    };

  const handlePublish =
    async gallery => {
      const confirmed =
        await confirm({
          type: 'info',

          title:
            '¿Publicar esta galería?',

          message:
            'El álbum y sus fotografías serán visibles para todos los lectores.',

          confirmLabel:
            'Sí, publicar',
        });

      if (!confirmed) {
        return;
      }

      setProcessingId(
        gallery.id
      );

      try {
        await publishGallery(
          gallery.id
        );

        alert.success(
          'Galería publicada',
          'El álbum ya está disponible públicamente'
        );

        await loadGalleries();
      } catch (error) {
        console.error(error);

        alert.error(
          'No se pudo publicar',
          error.response
            ?.data?.error ||
          'Verifica que tenga portada, autor y fotografías'
        );
      } finally {
        setProcessingId(null);
      }
    };

  const handleArchive =
    async gallery => {
      const confirmed =
        await confirm({
          type: 'warning',

          title:
            '¿Archivar esta galería?',

          message:
            'La galería dejará de estar disponible públicamente, pero podrás conservarla en el panel.',

          confirmLabel:
            'Sí, archivar',
        });

      if (!confirmed) {
        return;
      }

      setProcessingId(
        gallery.id
      );

      try {
        await archiveGallery(
          gallery.id
        );

        alert.success(
          'Galería archivada',
          'La galería ya no es pública'
        );

        await loadGalleries();
      } catch (error) {
        console.error(error);

        alert.error(
          'Error',
          'No se pudo archivar la galería'
        );
      } finally {
        setProcessingId(null);
      }
    };

  const handlePermanentDelete =
    async gallery => {
      const confirmed =
        await confirm({
          type: 'danger',

          title:
            '¿Eliminar permanentemente?',

          message:
            'Se eliminarán el álbum y sus registros fotográficos. Los archivos físicos subidos a R2 deberán limpiarse por separado.',

          confirmLabel:
            'Sí, eliminar para siempre',
        });

      if (!confirmed) {
        return;
      }

      setProcessingId(
        gallery.id
      );

      try {
        await deleteGalleryPermanently(
          gallery.id
        );

        setGalleries(
          current =>
            current.filter(
              item =>
                item.id !==
                gallery.id
            )
        );

        setTotal(
          current =>
            Math.max(
              0,
              current - 1
            )
        );

        alert.success(
          'Galería eliminada',
          'El álbum fue eliminado permanentemente'
        );
      } catch (error) {
        console.error(error);

        alert.error(
          'Error',
          error.response
            ?.data?.error ||
          'No se pudo eliminar la galería'
        );
      } finally {
        setProcessingId(null);
      }
    };

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        total / LIMIT
      )
    );

  return (
    <div className={styles.page}>
      <motion.header
        initial={{
          opacity: 0,
          y: 14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className={styles.header}
      >
        <div>
          <div
            className={
              styles.headerLabel
            }
          >
            Contenido visual
          </div>

          <h1
            className={
              styles.headerTitle
            }
          >
            Galerías
          </h1>
        </div>

        <Link
          to="/admin/galerias/nueva"
          className={
            styles.newButton
          }
        >
          <Plus size={16} />
          Nueva galería
        </Link>
      </motion.header>

      <motion.section
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.05,
        }}
        className={styles.filters}
      >
        <div
          className={
            styles.searchWrapper
          }
        >
          <Search
            size={15}
            className={
              styles.searchIcon
            }
          />

          <input
            type="text"
            value={search}
            onChange={event => {
              setSearch(
                event.target.value
              );
            }}
            placeholder="Buscar por título o autor..."
            className={
              styles.searchInput
            }
          />
        </div>

<div
  className={
    styles.statusFilter
  }
>
  <FolderOpen size={14} />

  <select
    value={
      editionFilter
    }
    onChange={event => {
      setEditionFilter(
        event.target.value
      );

      setPage(1);
    }}
  >
    <option value="all">
      Todas las ediciones
    </option>

    {editions
      .slice()
      .sort(
        (
          firstEdition,
          secondEdition
        ) =>
          Number(
            secondEdition.number ||
            0
          ) -
          Number(
            firstEdition.number ||
            0
          )
      )
      .map(edition => (
        <option
          key={edition.id}
          value={edition.id}
        >
          Edición № {edition.number}
          {edition.name
            ? ` — ${edition.name}`
            : ''}
        </option>
      ))}

    <option value="without-edition">
      Sin edición
    </option>
  </select>
</div>

<div
  className={
    styles.statusFilter
  }
>
  <Filter size={14} />

  <select
    value={
      statusFilter
    }
    onChange={event => {
      setStatusFilter(
        event.target.value
      );

      setPage(1);
    }}
  >
    <option value="all">
      Todos los estados
    </option>

    <option value="draft">
      Borradores
    </option>

    <option value="published">
      Publicadas
    </option>

    <option value="archived">
      Archivadas
    </option>
  </select>
</div>

        <div
          className={
            styles.total
          }
        >
          {total}{' '}
          {total === 1
            ? 'galería'
            : 'galerías'}
        </div>
      </motion.section>

      {loading ? (
        <GallerySkeleton />
      ) : search.trim() &&
        filteredGalleries.length ===
          0 ? (
        <EmptyState
          hasSearch={
            true
          }
        />
      ) : editions.length ===
          0 &&
        filteredGalleries.length ===
          0 ? (
        <EmptyState
          hasSearch={
            false
          }
        />
      ) : (
        <motion.section
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          className={
            styles.folderList
          }
        >
          {groupedGalleries.map(
            group => {
              const isOpen =
                Boolean(
                  openFolders[
                    group.key
                  ]
                );

              const editionLabel =
                group.edition
                  ? `Edición № ${group.edition.number}`
                  : 'Sin edición';

              return (
                <section
                  key={
                    group.key
                  }
                  className={
                    styles.folder
                  }
                >
                  <button
                    type="button"
                    className={
                      styles.folderHeader
                    }
                    onClick={() => {
                      toggleFolder(
                        group.key
                      );
                    }}
                    aria-expanded={
                      isOpen
                    }
                  >
                    <span
                      className={
                        styles.folderChevron
                      }
                    >
                      {isOpen ? (
                        <ChevronDown
                          size={18}
                        />
                      ) : (
                        <ChevronRight
                          size={18}
                        />
                      )}
                    </span>

                    <span
                      className={
                        styles.folderIcon
                      }
                    >
                      <FolderOpen
                        size={20}
                      />
                    </span>

                    <span
                      className={
                        styles.folderInfo
                      }
                    >
                      <span
                        className={
                          styles.folderTitleRow
                        }
                      >
                        <strong>
                          {editionLabel}
                        </strong>

                        {group.edition
                          ?.is_current && (
                          <span
                            className={
                              styles.currentEditionBadge
                            }
                          >
                            Edición actual
                          </span>
                        )}
                      </span>

                      {group.edition
                        ?.name && (
                        <small>
                          {
                            group
                              .edition
                              .name
                          }
                        </small>
                      )}
                    </span>

                    <span
                      className={
                        styles.folderCount
                      }
                    >
                      {
                        group
                          .galleries
                          .length
                      }{' '}
                      {group
                        .galleries
                        .length === 1
                        ? 'galería'
                        : 'galerías'}
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      className={
                        styles.folderContent
                      }
                    >
                      {group.galleries
                        .length >
                      0 ? (
                        <div
                          className={
                            styles.galleryGrid
                          }
                        >
                          {group.galleries.map(
                            (
                              gallery,
                              index
                            ) => (
                              <GalleryAdminCard
                                key={
                                  gallery.id
                                }
                                gallery={
                                  gallery
                                }
                                index={
                                  index
                                }
                                processingId={
                                  processingId
                                }
                                navigate={
                                  navigate
                                }
                                onPublish={
                                  handlePublish
                                }
                                onArchive={
                                  handleArchive
                                }
                                onDelete={
                                  handlePermanentDelete
                                }
                              />
                            )
                          )}
                        </div>
                      ) : (
                        <div
                          className={
                            styles.folderEmpty
                          }
                        >
                          <Images
                            size={28}
                          />

                          <div>
                            <strong>
                              Sin galerías
                            </strong>

                            <span>
                              No hay álbumes relacionados con esta edición.
                            </span>
                          </div>

                          <Link
                            to="/admin/galerias/nueva"
                            className={
                              styles.folderEmptyButton
                            }
                          >
                            <Plus
                              size={14}
                            />

                            Nueva galería
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              );
            }
          )}
        </motion.section>
      )}

      {totalPages > 1 && (
        <div
          className={
            styles.pagination
          }
        >
          <button
            type="button"
            disabled={
              page === 1
            }
            onClick={() => {
              setPage(
                current =>
                  Math.max(
                    1,
                    current - 1
                  )
              );
            }}
          >
            ← Anterior
          </button>

          <span>
            Página {page} de{' '}
            {totalPages}
          </span>

          <button
            type="button"
            disabled={
              page >=
              totalPages
            }
            onClick={() => {
              setPage(
                current =>
                  Math.min(
                    totalPages,
                    current + 1
                  )
              );
            }}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}

function GalleryAdminCard({
  gallery,
  index,
  processingId,
  navigate,
  onPublish,
  onArchive,
  onDelete,
}) {
  const status =
    STATUS_LABELS[
      gallery.status
    ] ||
    STATUS_LABELS.draft;

  const isProcessing =
    processingId ===
    gallery.id;

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 16,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay:
          Math.min(
            index,
            8
          ) * 0.04,
      }}
      className={
        styles.card
      }
    >
      <div
        className={
          styles.cardMedia
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
          />
        ) : (
          <div
            className={
              styles.cardPlaceholder
            }
          >
            <FileImage
              size={30}
            />
          </div>
        )}

        <span
          className={
            styles.statusBadge
          }
          style={{
            color:
              status.color,

            background:
              status.background,
          }}
        >
          {status.label}
        </span>

        <div
          className={
            styles.photoCount
          }
        >
          <Images
            size={13}
          />

          <span>
            {
              gallery.photos_count ||
              0
            }
          </span>
        </div>
      </div>

      <div
        className={
          styles.cardBody
        }
      >
        <h2
          className={
            styles.cardTitle
          }
        >
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
            {gallery
              .collaborators
              ?.name ||
              'Sin autor'}
          </span>

          <span>·</span>

          <span>
            {formatDate(
              gallery.published_at ||
              gallery.created_at
            )}
          </span>
        </div>

        <div
          className={
            styles.cardFooter
          }
        >
          <div
            className={
              styles.views
            }
          >
            <Eye
              size={13}
            />

            <span>
              {
                gallery.views ||
                0
              }
            </span>
          </div>

          <div
            className={
              styles.actions
            }
          >
            {gallery.status ===
              'published' && (
              <a
                href={`/galeria/${gallery.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  styles.actionButton
                }
                title="Ver galería"
              >
                <Eye size={15} />
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                navigate(
                  `/admin/galerias/editar/${gallery.id}`
                );
              }}
              className={
                styles.actionButton
              }
              title="Editar galería"
            >
              <Edit size={15} />
            </button>

            {gallery.status ===
              'draft' && (
              <button
                type="button"
                onClick={() => {
                  onPublish(
                    gallery
                  );
                }}
                disabled={
                  isProcessing
                }
                className={`${styles.actionButton} ${styles.publishAction}`}
                title="Publicar galería"
              >
                <Send size={15} />
              </button>
            )}

            {gallery.status ===
              'published' && (
              <button
                type="button"
                onClick={() => {
                  onArchive(
                    gallery
                  );
                }}
                disabled={
                  isProcessing
                }
                className={`${styles.actionButton} ${styles.archiveAction}`}
                title="Archivar galería"
              >
                <Archive
                  size={15}
                />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onDelete(
                  gallery
                );
              }}
              disabled={
                isProcessing
              }
              className={`${styles.actionButton} ${styles.deleteAction}`}
              title="Eliminar permanentemente"
            >
              <Trash2
                size={15}
              />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function GallerySkeleton() {
  return (
    <div
      className={
        styles.galleryGrid
      }
    >
      {Array.from({
        length: 6,
      }).map(
        (_, index) => (
          <div
            key={index}
            className={
              styles.skeleton
            }
          />
        )
      )}
    </div>
  );
}

function EmptyState({
  hasSearch,
}) {
  return (
    <div
      className={
        styles.empty
      }
    >
      <Images
        size={42}
      />

      <h2>
        {hasSearch
          ? 'No encontramos galerías'
          : 'Todavía no hay galerías'}
      </h2>

      <p>
        {hasSearch
          ? 'Intenta usar otro título o autor.'
          : 'Crea el primer álbum fotográfico de Agorá.'}
      </p>

      {!hasSearch && (
        <Link
          to="/admin/galerias/nueva"
          className={
            styles.emptyButton
          }
        >
          <Plus size={15} />
          Nueva galería
        </Link>
      )}
    </div>
  );
}
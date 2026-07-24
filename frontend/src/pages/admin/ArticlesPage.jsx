import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  getArticles,
  publishArticle,
  deleteArticle,
} from '../../api/articles.api';

import {
  getEditions,
} from '../../api/editions.api';

import {
  generateArticleVoice,
  generateBothArticleVoices,
  deleteArticleVoice,
} from '../../api/articleAudio.api';

import { formatDate } from '../../utils/formatDate';
import useAlert   from '../../hooks/useAlert';
import useConfirm from '../../hooks/useConfirm';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Send,
  FileText,
  Filter,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Mars,
  Venus,
  AudioLines,
  LoaderCircle,
  UploadCloud,
  Download,
} from 'lucide-react';

import {
  exportArticleHtml,
  exportAllToSubstack,
} from '../../api/articleTransfer.api';

import ArticleTransferModal
  from './articleTransfer/ArticleTransferModal';

import styles from './ArticlesPage.module.css';

const STATUS_LABELS = {
  draft:     { label: 'Borrador',  color: '#92400E', bg: '#FEF3C7' },
  published: { label: 'Publicado', color: '#065F46', bg: '#D1FAE5' },
  archived:  { label: 'Archivado', color: '#6B7280', bg: '#F3F4F6' },
};

export default function ArticlesPage() {
  const navigate = useNavigate();
  const alert    = useAlert();
  const confirm  = useConfirm();

  const [
    articles,
    setArticles,
  ] = useState([]);

  const [
    editions,
    setEditions,
  ] = useState([]);

  const [
    openFolders,
    setOpenFolders,
  ] = useState({});

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
    generatingAudio,
    setGeneratingAudio,
  ] = useState(null);

  const [
    transferModalOpen,
    setTransferModalOpen,
  ] = useState(false);

  const [
    exporting,
    setExporting,
  ] = useState(null);

  const LIMIT = 100;

  const load =
    async () => {
      setLoading(true);

      try {
        const params = {
          page,

          limit:
            LIMIT,

          status:
            statusFilter,

          edition_id:
            editionFilter,
        };

        const [
          articlesResponse,
          editionsResponse,
        ] =
          await Promise.all([
            getArticles(
              params
            ),

            getEditions(),
          ]);

        const articleList =
          Array.isArray(
            articlesResponse
              ?.data
          )
            ? articlesResponse.data
            : Array.isArray(
                articlesResponse
              )
              ? articlesResponse
              : [];

        const editionList =
          Array.isArray(
            editionsResponse
          )
            ? editionsResponse
            : Array.isArray(
                editionsResponse
                  ?.data
              )
              ? editionsResponse.data
              : [];

        setArticles(
          articleList
        );

        setEditions(
          editionList
        );

        setTotal(
          Number(
            articlesResponse
              ?.total ||
            articleList.length ||
            0
          )
        );
      } catch (error) {
        console.error(
          'ERROR cargando artículos y ediciones:',
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
          'No se pudieron cargar los artículos'
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    load();
  }, [
    page,
    statusFilter,
    editionFilter,
  ]);

  const filtered =
    useMemo(
      () => {
        const normalizedSearch =
          search
            .trim()
            .toLocaleLowerCase(
              'es-MX'
            );

        if (
          !normalizedSearch
        ) {
          return articles;
        }

        return articles.filter(
          article => {
            const title =
              String(
                article.title ||
                ''
              )
                .toLocaleLowerCase(
                  'es-MX'
                );

            const author =
              String(
                article
                  .collaborators
                  ?.name ||
                ''
              )
                .toLocaleLowerCase(
                  'es-MX'
                );

            const editionName =
              String(
                article
                  .editions
                  ?.name ||
                ''
              )
                .toLocaleLowerCase(
                  'es-MX'
                );

            const editionNumber =
              String(
                article
                  .editions
                  ?.number ||
                ''
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
      },
      [
        articles,
        search,
      ]
    );

  const articleFolders =
    useMemo(
      () => {
        const hasSearch =
          Boolean(
            search.trim()
          );

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
                const firstCurrent =
                  Boolean(
                    firstEdition
                      .is_current
                  );

                const secondCurrent =
                  Boolean(
                    secondEdition
                      .is_current
                  );

                if (
                  firstCurrent !==
                  secondCurrent
                ) {
                  return firstCurrent
                    ? -1
                    : 1;
                }

                const firstSpecial =
                  Boolean(
                    firstEdition
                      .is_special
                  );

                const secondSpecial =
                  Boolean(
                    secondEdition
                      .is_special
                  );

                if (
                  firstSpecial !==
                  secondSpecial
                ) {
                  return firstSpecial
                    ? 1
                    : -1;
                }

                if (
                  !firstSpecial &&
                  !secondSpecial
                ) {
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

                return String(
                  firstEdition
                    .name ||
                  ''
                ).localeCompare(
                  String(
                    secondEdition
                      .name ||
                    ''
                  ),
                  'es',
                  {
                    sensitivity:
                      'base',
                  }
                );
              }
            )
            .map(
              edition => {
                const folderArticles =
                  filtered.filter(
                    article => {
                      const articleEditionId =
                        article
                          .edition_id ||
                        article
                          .editions
                          ?.id ||
                        null;

                      return (
                        String(
                          articleEditionId
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

                  articles:
                    folderArticles,
                };
              }
            )
            .filter(
              folder =>
                !hasSearch ||
                folder
                  .articles
                  .length >
                  0
            );

        const articlesWithoutEdition =
          filtered.filter(
            article =>
              !article
                .edition_id &&
              !article
                .editions
                ?.id
          );

        const withoutEditionFolder = {
          key:
            'without-edition',

          edition:
            null,

          articles:
            articlesWithoutEdition,
        };

        const shouldShowWithoutEdition =
          editionFilter === 'all' ||
          editionFilter ===
            'without-edition';

        if (
          !shouldShowWithoutEdition
        ) {
          return editionGroups;
        }

        if (
          hasSearch &&
          articlesWithoutEdition
            .length ===
            0
        ) {
          return editionGroups;
        }

        return [
          ...editionGroups,
          withoutEditionFolder,
        ];
      },
      [
        editions,
        filtered,
        search,
        editionFilter,
      ]
    );

  useEffect(
    () => {
      setOpenFolders(
        current => {
          const next = {
            ...current,
          };

          articleFolders.forEach(
            (
              folder,
              index
            ) => {
              if (
                Object.prototype
                  .hasOwnProperty
                  .call(
                    next,
                    folder.key
                  )
              ) {
                return;
              }

              next[
                folder.key
              ] =
                Boolean(
                  folder
                    .edition
                    ?.is_current
                ) ||
                index === 0;
            }
          );

          return next;
        }
      );
    },
    [
      articleFolders,
    ]
  );

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

const handlePublish = async (id) => {
  const ok = await confirm({
    type: 'info',
    title: '¿Publicar este artículo?',
    message: 'El artículo será visible para todos los lectores.',
    confirmLabel: 'Sí, publicar',
  });
  if (!ok) return;
    try {
      await publishArticle(id);
      alert.success('Publicado', 'El artículo ya está visible');
      load();
    } catch {
      alert.error('Error', 'No se pudo publicar');
    }
  };

const handleDelete = async (id) => {
  const ok = await confirm({
    type: 'danger',
    title: '¿Eliminar este artículo?',
    message: 'Esta acción eliminará el artículo permanentemente.',
    confirmLabel: 'Sí, eliminar',
  });

  if (!ok) return;

  try {
    await deleteArticle(id);

    setArticles(prev =>
      prev.filter(article =>
        article.id !== id
      )
    );

    setTotal(prev =>
      Math.max(0, prev - 1)
    );

    alert.success(
      'Eliminado',
      'El artículo fue eliminado correctamente'
    );
  } catch (error) {
    console.error(error);

    alert.error(
      'Error',
      'No se pudo eliminar el artículo'
    );
  }
};

const handleGenerateVoice = async (
  article,
  voice
) => {
  const voiceName =
    voice === 'male'
      ? 'Jorge'
      : 'Dalia';

  const hasExistingAudio =
    voice === 'male'
      ? Boolean(article.audio_male_url)
      : Boolean(article.audio_female_url);

  const ok = await confirm({
    type: 'info',

    title:
      hasExistingAudio
        ? `¿Regenerar la voz de ${voiceName}?`
        : `¿Generar la voz de ${voiceName}?`,

    message:
      hasExistingAudio
        ? 'El audio anterior será sustituido por una narración nueva.'
        : 'La narración se generará usando el texto actual del artículo.',

    confirmLabel:
      hasExistingAudio
        ? 'Sí, regenerar'
        : 'Sí, generar',
  });

  if (!ok) return;

  const operationKey =
    `${article.id}:${voice}`;

  setGeneratingAudio(operationKey);

  try {
    await generateArticleVoice(
      article.id,
      voice
    );

    alert.success(
      'Audio generado',
      `La narración de ${voiceName} ya está disponible.`
    );

    await load();
  } catch (error) {
    console.error(error);

    alert.error(
      'Error de narración',
      error.response?.data?.message ||
      error.response?.data?.error ||
      'No se pudo generar el audio.'
    );
  } finally {
    setGeneratingAudio(null);
  }
};

const handleGenerateBoth = async (
  article
) => {
  const ok = await confirm({
    type: 'info',
    title: '¿Generar ambas voces?',
    message:
      'Jorge y Dalia se generarán simultáneamente. El proceso puede tardar alrededor de un minuto según la extensión del artículo.',
    confirmLabel: 'Sí, generar ambas',
  });

  if (!ok) return;

  const operationKey =
    `${article.id}:both`;

  setGeneratingAudio(operationKey);

  try {
    await generateBothArticleVoices(
      article.id
    );

    alert.success(
      'Narraciones generadas',
      'Las voces de Jorge y Dalia ya están disponibles.'
    );

    await load();
  } catch (error) {
    console.error(error);

    alert.error(
      'Error de narración',
      error.response?.data?.message ||
      error.response?.data?.error ||
      'No se pudieron generar ambas voces.'
    );
  } finally {
    setGeneratingAudio(null);
  }
};

const handleDeleteVoice = async (
  article,
  voice
) => {
  const voiceName =
    voice === 'male'
      ? 'Jorge'
      : 'Dalia';

  const ok = await confirm({
    type: 'danger',
    title:
      `¿Eliminar el audio de ${voiceName}?`,
    message:
      'La narración dejará de estar disponible para los lectores.',
    confirmLabel:
      'Sí, eliminar audio',
  });

  if (!ok) return;

  const operationKey =
    `${article.id}:delete-${voice}`;

  setGeneratingAudio(operationKey);

  try {
    await deleteArticleVoice(
      article.id,
      voice
    );

    alert.success(
      'Audio eliminado',
      `Se eliminó la narración de ${voiceName}.`
    );

    await load();
  } catch (error) {
    console.error(error);

    alert.error(
      'Error',
      error.response?.data?.message ||
      error.response?.data?.error ||
      'No se pudo eliminar el audio.'
    );
  } finally {
    setGeneratingAudio(null);
  }
};

  const handleExportArticle =
    async article => {
      setExporting(
        article.id
      );

      try {
        await exportArticleHtml(
          article
        );

        alert.success(
          'Artículo exportado',
          'El archivo HTML fue generado correctamente'
        );
      } catch (error) {
        console.error(error);

        alert.error(
          'Error de exportación',
          error.response?.data?.message ||
          error.response?.data?.error ||
          'No se pudo exportar el artículo'
        );
      } finally {
        setExporting(null);
      }
    };

  const handleExportAll =
    async () => {
      setExporting('all');

      try {
        await exportAllToSubstack();

        alert.success(
          'Exportación preparada',
          'Se descargó el XML compatible con WordPress/Substack'
        );
      } catch (error) {
        console.error(error);

        alert.error(
          'Error de exportación',
          error.response?.data?.message ||
          error.response?.data?.error ||
          'No se pudieron exportar los artículos'
        );
      } finally {
        setExporting(null);
      }
    };

  const totalPages =
    Math.ceil(
      total / LIMIT
    );

  const renderArticleRow =
    art => {
      const status =
        STATUS_LABELS[
          art.status
        ] ||
        STATUS_LABELS.draft;

      const categories =
        art
          .article_categories
          ?.map(
            articleCategory =>
              articleCategory
                .categories
                ?.name
          )
          .filter(
            Boolean
          ) ||
        [];

      return (
        <tr
          key={
            art.id
          }
        >
          <td
            className={
              styles.tdArticle
            }
          >
            <div
              className={
                styles.articleInfo
              }
            >
              {art.cover_image_url ? (
                <img
                  src={
                    art.cover_image_url
                  }
                  alt=""
                  className={
                    styles.articleThumb
                  }
                />
              ) : (
                <div
                  className={
                    styles.articleThumbEmpty
                  }
                >
                  <FileText
                    size={14}
                  />
                </div>
              )}

              <div>
                <div
                  className={
                    styles.articleTitle
                  }
                >
                  {art.title}
                </div>

                {art.subtitle && (
                  <div
                    className={
                      styles.articleSubtitle
                    }
                  >
                    {
                      art.subtitle
                    }
                  </div>
                )}
              </div>
            </div>
          </td>

          <td
            className={
              styles.tdMuted
            }
          >
            {art
              .collaborators
              ?.name ||
              '—'}
          </td>

          <td>
            <div
              className={
                styles.catTags
              }
            >
              {categories
                .slice(
                  0,
                  2
                )
                .map(
                  category => (
                    <span
                      key={
                        category
                      }
                      className={
                        styles.catTag
                      }
                    >
                      {category}
                    </span>
                  )
                )}

              {categories.length >
                2 && (
                <span
                  className={
                    styles.catTagMore
                  }
                >
                  +
                  {
                    categories.length -
                    2
                  }
                </span>
              )}
            </div>
          </td>

          <td>
            <span
              className={
                styles.statusBadge
              }
              style={{
                background:
                  status.bg,

                color:
                  status.color,
              }}
            >
              {status.label}
            </span>
          </td>

          <td>
            <div
              className={
                styles.audioActions
              }
            >
              <button
                type="button"
                className={`
                  ${styles.audioVoiceBtn}
                  ${
                    art.audio_male_url
                      ? styles.audioVoiceReady
                      : ''
                  }
                `}
                onClick={() => {
                  handleGenerateVoice(
                    art,
                    'male'
                  );
                }}
                disabled={
                  Boolean(
                    generatingAudio
                  )
                }
                title={
                  art.audio_male_url
                    ? 'Regenerar voz de Jorge'
                    : 'Generar voz de Jorge'
                }
              >
                {generatingAudio ===
                `${art.id}:male` ? (
                  <LoaderCircle
                    size={14}
                    className={
                      styles.spinning
                    }
                  />
                ) : (
                  <Mars
                    size={14}
                  />
                )}
              </button>

              <button
                type="button"
                className={`
                  ${styles.audioVoiceBtn}
                  ${
                    art.audio_female_url
                      ? styles.audioVoiceReady
                      : ''
                  }
                `}
                onClick={() => {
                  handleGenerateVoice(
                    art,
                    'female'
                  );
                }}
                disabled={
                  Boolean(
                    generatingAudio
                  )
                }
                title={
                  art.audio_female_url
                    ? 'Regenerar voz de Dalia'
                    : 'Generar voz de Dalia'
                }
              >
                {generatingAudio ===
                `${art.id}:female` ? (
                  <LoaderCircle
                    size={14}
                    className={
                      styles.spinning
                    }
                  />
                ) : (
                  <Venus
                    size={14}
                  />
                )}
              </button>

              <button
                type="button"
                className={
                  styles.audioBothBtn
                }
                onClick={() => {
                  handleGenerateBoth(
                    art
                  );
                }}
                disabled={
                  Boolean(
                    generatingAudio
                  )
                }
                title="Generar ambas voces"
              >
                {generatingAudio ===
                `${art.id}:both` ? (
                  <LoaderCircle
                    size={14}
                    className={
                      styles.spinning
                    }
                  />
                ) : (
                  <AudioLines
                    size={14}
                  />
                )}
              </button>

              {art.audio_male_url && (
                <button
                  type="button"
                  className={
                    styles.audioDeleteBtn
                  }
                  onClick={() => {
                    handleDeleteVoice(
                      art,
                      'male'
                    );
                  }}
                  disabled={
                    Boolean(
                      generatingAudio
                    )
                  }
                  title="Eliminar voz de Jorge"
                >
                  {generatingAudio ===
                  `${art.id}:delete-male` ? (
                    <LoaderCircle
                      size={11}
                      className={
                        styles.spinning
                      }
                    />
                  ) : (
                    <>
                      <span>
                        M
                      </span>

                      <Trash2
                        size={11}
                      />
                    </>
                  )}
                </button>
              )}

              {art.audio_female_url && (
                <button
                  type="button"
                  className={
                    styles.audioDeleteBtn
                  }
                  onClick={() => {
                    handleDeleteVoice(
                      art,
                      'female'
                    );
                  }}
                  disabled={
                    Boolean(
                      generatingAudio
                    )
                  }
                  title="Eliminar voz de Dalia"
                >
                  {generatingAudio ===
                  `${art.id}:delete-female` ? (
                    <LoaderCircle
                      size={11}
                      className={
                        styles.spinning
                      }
                    />
                  ) : (
                    <>
                      <span>
                        F
                      </span>

                      <Trash2
                        size={11}
                      />
                    </>
                  )}
                </button>
              )}
            </div>

            {art.audio_status ===
              'outdated' && (
              <div
                className={
                  styles.audioOutdated
                }
              >
                Texto modificado
              </div>
            )}

            {art.audio_status ===
              'error' && (
              <div
                className={
                  styles.audioError
                }
              >
                Error de audio
              </div>
            )}
          </td>

          <td
            className={
              styles.tdMuted
            }
          >
            {art.published_at
              ? formatDate(
                  art.published_at
                )
              : formatDate(
                  art.created_at
                )}
          </td>

          <td
            className={
              styles.tdViews
            }
          >
            <div
              className={
                styles.viewsInline
              }
            >
              <Eye
                size={12}
              />

              <span>
                {
                  art.views ||
                  0
                }
              </span>
            </div>
          </td>

          <td>
            <div
              className={
                styles.actions
              }
            >
              {art.status ===
                'published' && (
                <a
                  href={`/articulos/${art.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    styles.actionBtn
                  }
                  title="Ver en sitio"
                >
                  <Eye
                    size={14}
                  />
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  navigate(
                    `/admin/articulos/editar/${art.id}`
                  );
                }}
                className={
                  styles.actionBtn
                }
                title="Editar"
              >
                <Edit
                  size={14}
                />
              </button>

              <button
                type="button"
                onClick={() => {
                  handleExportArticle(
                    art
                  );
                }}
                className={
                  styles.actionBtn
                }
                title="Exportar HTML"
                disabled={
                  Boolean(
                    exporting
                  )
                }
              >
                {exporting ===
                art.id ? (
                  <LoaderCircle
                    size={14}
                    className={
                      styles.spinning
                    }
                  />
                ) : (
                  <Download
                    size={14}
                  />
                )}
              </button>

              {art.status ===
                'draft' && (
                <button
                  type="button"
                  onClick={() => {
                    handlePublish(
                      art.id
                    );
                  }}
                  className={`${styles.actionBtn} ${styles.actionPublish}`}
                  title="Publicar"
                >
                  <Send
                    size={14}
                  />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  handleDelete(
                    art.id
                  );
                }}
                className={`${styles.actionBtn} ${styles.actionDelete}`}
                title="Eliminar"
              >
                <Trash2
                  size={14}
                />
              </button>
            </div>
          </td>
        </tr>
      );
    };

  return (
    <div className={styles.page}>

      {/* ── Header ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.header}
      >
        <div>
          <div className={styles.headerLabel}>Contenido</div>
          <h1 className={styles.headerTitle}>Artículos</h1>
        </div>
        <div
          className={
            styles.headerActions
          }
        >
          <button
            type="button"
            className={
              styles.transferBtn
            }
            onClick={() => {
              setTransferModalOpen(
                true
              );
            }}
          >
            <UploadCloud
              size={16}
            />

            Importar Substack
          </button>

          <button
            type="button"
            className={
              styles.transferBtn
            }
            onClick={
              handleExportAll
            }
            disabled={
              Boolean(exporting)
            }
          >
            {exporting ===
            'all' ? (
              <LoaderCircle
                size={16}
                className={
                  styles.spinning
                }
              />
            ) : (
              <Download
                size={16}
              />
            )}

            Exportar para Substack
          </button>

          <Link
            to="/admin/articulos/nuevo"
            className={
              styles.newBtn
            }
          >
            <Plus size={16} />
            Nuevo artículo
          </Link>
        </div>
      </motion.div>

      {/* ── Filtros ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className={styles.filters}
      >
        {/* Búsqueda */}
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título o autor..."
            className={styles.searchInput}
          />
        </div>

{/* Filtro de edición */}
<div className={styles.filterWrap}>
  <FolderOpen size={14} />

  <select
    value={editionFilter}
    onChange={event => {
      setEditionFilter(
        event.target.value
      );

      setPage(1);
    }}
    className={
      styles.filterSelect
    }
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
        ) => {
          const firstCurrent =
            Boolean(
              firstEdition
                .is_current
            );

          const secondCurrent =
            Boolean(
              secondEdition
                .is_current
            );

          if (
            firstCurrent !==
            secondCurrent
          ) {
            return firstCurrent
              ? -1
              : 1;
          }

          const firstSpecial =
            Boolean(
              firstEdition
                .is_special
            );

          const secondSpecial =
            Boolean(
              secondEdition
                .is_special
            );

          if (
            firstSpecial !==
            secondSpecial
          ) {
            return firstSpecial
              ? 1
              : -1;
          }

          if (
            !firstSpecial &&
            !secondSpecial
          ) {
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

          return String(
            firstEdition.name ||
            ''
          ).localeCompare(
            String(
              secondEdition.name ||
              ''
            ),
            'es',
            {
              sensitivity:
                'base',
            }
          );
        }
      )
      .map(
        edition => {
          const optionLabel =
            edition.is_special
              ? `Especial — ${edition.name}`
              : `Edición № ${edition.number}${
                  edition.name
                    ? ` — ${edition.name}`
                    : ''
                }`;

          return (
            <option
              key={
                edition.id
              }
              value={
                edition.id
              }
            >
              {optionLabel}
            </option>
          );
        }
      )}

    <option value="without-edition">
      Sin edición
    </option>
  </select>

  <ChevronDown size={13} />
</div>

{/* Filtro de estado */}
<div className={styles.filterWrap}>
  <Filter size={14} />

  <select
    value={statusFilter}
    onChange={event => {
      setStatusFilter(
        event.target.value
      );

      setPage(1);
    }}
    className={
      styles.filterSelect
    }
  >
    <option value="all">
      Todos los estados
    </option>

    <option value="draft">
      Borradores
    </option>

    <option value="published">
      Publicados
    </option>

    <option value="archived">
      Archivados
    </option>
  </select>

  <ChevronDown size={13} />
</div>

        <div className={styles.totalCount}>
          {total} artículo{total !== 1 ? 's' : ''}
        </div>
      </motion.div>

      {/* ── Carpetas por edición ──────────────────────────── */}
      <motion.div
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        transition={{
          delay: 0.1,
        }}
        className={
          styles.foldersList
        }
      >
        {loading ? (
          <div
            className={
              styles.tableWrap
            }
          >
            <TableSkeleton />
          </div>
        ) : search.trim() &&
          filtered.length ===
            0 ? (
          <div
            className={
              styles.tableWrap
            }
          >
            <EmptyState
              search={
                search
              }
            />
          </div>
        ) : editions.length ===
            0 &&
          articles.length ===
            0 ? (
          <div
            className={
              styles.tableWrap
            }
          >
            <EmptyState
              search=""
            />
          </div>
        ) : (
          articleFolders.map(
            folder => {
              const isOpen =
                Boolean(
                  openFolders[
                    folder.key
                  ]
                );

              const folderTitle =
                !folder.edition
                  ? 'Sin edición'
                  : folder.edition
                      .is_special
                    ? 'Edición especial'
                    : `Edición № ${folder.edition.number}`;

              return (
                <section
                  key={
                    folder.key
                  }
                  className={
                    styles.editionFolder
                  }
                >
                  <button
                    type="button"
                    className={
                      styles.folderHeader
                    }
                    onClick={() => {
                      toggleFolder(
                        folder.key
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
                        size={21}
                      />
                    </span>

                    <span
                      className={
                        styles.folderInformation
                      }
                    >
                      <span
                        className={
                          styles.folderTitleRow
                        }
                      >
                        <strong>
                          {folderTitle}
                        </strong>

                        {folder
                          .edition
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

                      {folder
                        .edition
                        ?.name && (
                        <small>
                          {
                            folder
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
                        folder
                          .articles
                          .length
                      }{' '}
                      {folder
                        .articles
                        .length ===
                      1
                        ? 'artículo'
                        : 'artículos'}
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      className={
                        styles.folderContent
                      }
                    >
                      {folder
                        .articles
                        .length >
                      0 ? (
                        <div
                          className={
                            styles.folderTableScroll
                          }
                        >
                          <table
                            className={
                              styles.table
                            }
                          >
                            <thead>
                              <tr>
                                <th>
                                  Artículo
                                </th>

                                <th>
                                  Autor
                                </th>

                                <th>
                                  Secciones
                                </th>

                                <th>
                                  Estado
                                </th>

                                <th>
                                  Audio
                                </th>

                                <th>
                                  Fecha
                                </th>

                                <th>
                                  Vistas
                                </th>

                                <th>
                                  Acciones
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {folder
                                .articles
                                .map(
                                  renderArticleRow
                                )}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div
                          className={
                            styles.folderEmpty
                          }
                        >
                          <FileText
                            size={27}
                          />

                          <div>
                            <strong>
                              Sin artículos
                            </strong>

                            <span>
                              No hay artículos relacionados con esta edición.
                            </span>
                          </div>

                          <Link
                            to="/admin/articulos/nuevo"
                            className={
                              styles.folderEmptyButton
                            }
                          >
                            <Plus
                              size={14}
                            />

                            Nuevo artículo
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              );
            }
          )
        )}
      </motion.div>

      {/* ── Paginación ────────────────────────────────────── */}
      {totalPages > 1 && (
        <div
          className={
            styles.pagination
          }
        >
          <button
            onClick={() =>
              setPage(previous =>
                Math.max(
                  1,
                  previous - 1
                )
              )
            }
            disabled={
              page === 1
            }
            className={
              styles.pageBtn
            }
          >
            ← Anterior
          </button>

          <span
            className={
              styles.pageInfo
            }
          >
            Página {page} de{' '}
            {totalPages}
          </span>

          <button
            onClick={() =>
              setPage(previous =>
                Math.min(
                  totalPages,
                  previous + 1
                )
              )
            }
            disabled={
              page === totalPages
            }
            className={
              styles.pageBtn
            }
          >
            Siguiente →
          </button>
        </div>
      )}

      <ArticleTransferModal
        open={
          transferModalOpen
        }
        onClose={() => {
          setTransferModalOpen(
            false
          );
        }}
        onImported={
          load
        }
      />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className={styles.skeleton}>
      {[1,2,3,4,5].map(i => (
        <div key={i} className={styles.skeletonRow} />
      ))}
    </div>
  );
}

function EmptyState({ search }) {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}>✦</span>
      <h3>
        {search
          ? `Sin resultados para "${search}"`
          : 'No hay artículos todavía'
        }
      </h3>
      <p>
        {search
          ? 'Intenta con otro término de búsqueda'
          : 'Crea el primer artículo de la revista'
        }
      </p>
      {!search && (
        <Link to="/admin/articulos/nuevo" className={styles.emptyBtn}>
          <Plus size={14} /> Nuevo artículo
        </Link>
      )}
    </div>
  );
}
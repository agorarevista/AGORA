import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Images,
  LoaderCircle,
  Save,
  Search,
  Settings2,
  X,
} from 'lucide-react';

import {
  getArticles,
  updateArticleSeo,
} from '../../api/articles.api';

import {
  getAdminGalleries,
  updateGallerySeo,
} from '../../api/galleries.api';

import {
  uploadFile,
} from '../../api/admin.api';

import useAlert from '../../hooks/useAlert';

import styles from './SeoPage.module.css';

const SITE_URL =
  'https://agorarevista.mx';

const EMPTY_FORM = {
  seo_title: '',
  seo_description: '',
  social_title: '',
  social_description: '',
  social_image_url: '',
};

const normalizeItems = (
  items,
  type
) => {
  return (
    Array.isArray(items)
      ? items
      : []
  ).map(item => ({
    ...item,
    content_type:
      type,
  }));
};

const getPublicUrl =
  item => {
    if (
      item.content_type ===
      'gallery'
    ) {
      return (
        `${SITE_URL}/galeria/${item.slug}`
      );
    }

    return (
      `${SITE_URL}/articulos/${item.slug}`
    );
  };

const getFallbackDescription =
  item => {
    return (
      item.excerpt ||
      item.subtitle ||
      ''
    );
  };

const getSocialTitle =
  item => {
    return (
      item.social_title ||
      item.seo_title ||
      item.title ||
      'Agorá Revista'
    );
  };

const getSocialDescription =
  item => {
    return (
      item.social_description ||
      item.seo_description ||
      getFallbackDescription(
        item
      )
    );
  };

const getSocialImage =
  item => {
    return (
      item.social_image_url ||
      item.cover_image_url ||
      ''
    );
  };

const getSeoCompletion =
  item => {
    const values = [
      item.seo_title,
      item.seo_description,
      item.social_title,
      item.social_description,
      item.social_image_url,
    ];

    const completed =
      values.filter(Boolean)
        .length;

    if (completed === 5) {
      return {
        label:
          'Completo',

        level:
          'complete',
      };
    }

    if (completed > 0) {
      return {
        label:
          `${completed}/5 campos`,

        level:
          'partial',
      };
    }

    return {
      label:
        'Sin configurar',

      level:
        'empty',
    };
  };

export default function SeoPage() {
  const alert =
    useAlert();

  const [
    items,
    setItems,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    typeFilter,
    setTypeFilter,
  ] = useState('all');

  const [
    selectedItem,
    setSelectedItem,
  ] = useState(null);

  const [
    form,
    setForm,
  ] = useState(
    EMPTY_FORM
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    uploadingImage,
    setUploadingImage,
  ] = useState(false);

  const loadContent =
    async () => {
      setLoading(true);

      try {
        const [
          articlesResult,
          galleriesResult,
        ] = await Promise.all([
          getArticles({
            status: 'all',
            limit: 100,
          }),

          getAdminGalleries({
            status: 'all',
            limit: 100,
          }),
        ]);

        const articles =
          normalizeItems(
            articlesResult?.data,
            'article'
          );

        const galleries =
          normalizeItems(
            galleriesResult?.data,
            'gallery'
          );

        setItems([
          ...articles,
          ...galleries,
        ]);
      } catch (error) {
        console.error(error);

        alert.error(
          'No se pudo cargar SEO',
          error.response
            ?.data?.error ||
            'Ocurrió un error cargando el contenido'
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadContent();
  }, []);

  const filteredItems =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLocaleLowerCase(
            'es-MX'
          );

      return items.filter(
        item => {
          const matchesType =
            typeFilter ===
              'all' ||
            item.content_type ===
              typeFilter;

          const matchesSearch =
            !query ||
            String(
              item.title ||
              ''
            )
              .toLocaleLowerCase(
                'es-MX'
              )
              .includes(query) ||
            String(
              item.slug ||
              ''
            )
              .toLocaleLowerCase(
                'es-MX'
              )
              .includes(query);

          return (
            matchesType &&
            matchesSearch
          );
        }
      );
    }, [
      items,
      search,
      typeFilter,
    ]);

  const openEditor =
    item => {
      setSelectedItem(
        item
      );

      setForm({
        seo_title:
          item.seo_title ||
          '',

        seo_description:
          item.seo_description ||
          '',

        social_title:
          item.social_title ||
          '',

        social_description:
          item.social_description ||
          '',

        social_image_url:
          item.social_image_url ||
          '',
      });
    };

  const closeEditor =
    () => {
      if (
        saving ||
        uploadingImage
      ) {
        return;
      }

      setSelectedItem(
        null
      );

      setForm(
        EMPTY_FORM
      );
    };

  const updateField = (
    field,
    value
  ) => {
    setForm(
      current => ({
        ...current,
        [field]:
          value,
      })
    );
  };

  const handleSocialImageUpload =
    async event => {
      const file =
        event.target
          .files?.[0];

      event.target.value =
        '';

      if (!file) {
        return;
      }

      setUploadingImage(
        true
      );

      try {
        const result =
          await uploadFile(
            file,
            'seo/social'
          );

        updateField(
          'social_image_url',
          result.url
        );

        alert.success(
          'Imagen subida',
          'La imagen social se agregó correctamente'
        );
      } catch (error) {
        console.error(error);

        alert.error(
          'No se pudo subir',
          error.response
            ?.data?.error ||
            'No se pudo subir la imagen social'
        );
      } finally {
        setUploadingImage(
          false
        );
      }
    };

  const handleSave =
    async event => {
      event.preventDefault();

      if (!selectedItem) {
        return;
      }

      setSaving(true);

      try {
        const payload = {
          seo_title:
            form.seo_title
              .trim(),

          seo_description:
            form.seo_description
              .trim(),

          social_title:
            form.social_title
              .trim(),

          social_description:
            form.social_description
              .trim(),

          social_image_url:
            form.social_image_url
              .trim(),
        };

        const updated =
          selectedItem
            .content_type ===
            'gallery'
            ? await updateGallerySeo(
                selectedItem.id,
                payload
              )
            : await updateArticleSeo(
                selectedItem.id,
                payload
              );

        setItems(
          current =>
            current.map(
              item =>
                item.id ===
                  selectedItem.id &&
                item.content_type ===
                  selectedItem
                    .content_type
                  ? {
                      ...item,
                      ...updated,
                      ...payload,
                    }
                  : item
            )
        );

        alert.success(
          'SEO actualizado',
          'La configuración se guardó correctamente'
        );

        closeEditor();
      } catch (error) {
        console.error(error);

        alert.error(
          'No se pudo guardar',
          error.response
            ?.data?.error ||
            error.message ||
            'Ocurrió un error guardando el SEO'
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <div
      className={
        styles.page
      }
    >
      <header
        className={
          styles.header
        }
      >
        <div>
          <div
            className={
              styles.eyebrow
            }
          >
            Sistema
          </div>

          <h1>
            SEO y vista social
          </h1>

          <p>
            Configura cómo aparecen los
            artículos y galerías en Google
            y al compartir sus enlaces.
          </p>
        </div>

        <div
          className={
            styles.summary
          }
        >
          <strong>
            {items.length}
          </strong>

          <span>
            contenidos
          </span>
        </div>
      </header>

      <section
        className={
          styles.filters
        }
      >
        <label
          className={
            styles.searchBox
          }
        >
          <Search
            size={17}
          />

          <input
            type="search"
            value={search}
            onChange={event => {
              setSearch(
                event.target.value
              );
            }}
            placeholder="Buscar por título o slug..."
          />
        </label>

        <div
          className={
            styles.typeFilters
          }
        >
          <button
            type="button"
            className={
              typeFilter ===
              'all'
                ? styles.filterActive
                : ''
            }
            onClick={() => {
              setTypeFilter(
                'all'
              );
            }}
          >
            Todos
          </button>

          <button
            type="button"
            className={
              typeFilter ===
              'article'
                ? styles.filterActive
                : ''
            }
            onClick={() => {
              setTypeFilter(
                'article'
              );
            }}
          >
            <FileText
              size={14}
            />

            Artículos
          </button>

          <button
            type="button"
            className={
              typeFilter ===
              'gallery'
                ? styles.filterActive
                : ''
            }
            onClick={() => {
              setTypeFilter(
                'gallery'
              );
            }}
          >
            <Images
              size={14}
            />

            Galerías
          </button>
        </div>
      </section>

      {loading ? (
        <div
          className={
            styles.loading
          }
        >
          <LoaderCircle
            size={28}
            className={
              styles.spinning
            }
          />

          Cargando contenido...
        </div>
      ) : filteredItems.length ===
        0 ? (
        <div
          className={
            styles.empty
          }
        >
          No se encontraron contenidos.
        </div>
      ) : (
        <section
          className={
            styles.contentList
          }
        >
          {filteredItems.map(
            item => {
              const completion =
                getSeoCompletion(
                  item
                );

              const image =
                getSocialImage(
                  item
                );

              return (
                <article
                  key={`${item.content_type}-${item.id}`}
                  className={
                    styles.contentCard
                  }
                >
                  <div
                    className={
                      styles.thumbnail
                    }
                  >
                    {image ? (
                      <img
                        src={image}
                        alt=""
                      />
                    ) : (
                      <ImageIcon
                        size={25}
                      />
                    )}
                  </div>

                  <div
                    className={
                      styles.contentInfo
                    }
                  >
                    <div
                      className={
                        styles.contentType
                      }
                    >
                      {item.content_type ===
                      'gallery'
                        ? 'Galería'
                        : 'Artículo'}
                    </div>

                    <h2>
                      {item.title}
                    </h2>

                    <div
                      className={
                        styles.slug
                      }
                    >
                      {getPublicUrl(
                        item
                      )}
                    </div>
                  </div>

                  <span
                    className={
                      styles.seoStatus
                    }
                    data-level={
                      completion.level
                    }
                  >
                    {
                      completion.label
                    }
                  </span>

                  <div
                    className={
                      styles.cardActions
                    }
                  >
                    <a
                      href={getPublicUrl(
                        item
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir contenido"
                    >
                      <ExternalLink
                        size={16}
                      />
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        openEditor(
                          item
                        );
                      }}
                    >
                      <Settings2
                        size={16}
                      />

                      Editar SEO
                    </button>
                  </div>
                </article>
              );
            }
          )}
        </section>
      )}

      {selectedItem && (
        <div
          className={
            styles.modalBackdrop
          }
          onMouseDown={event => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeEditor();
            }
          }}
        >
          <form
            className={
              styles.modal
            }
            onSubmit={
              handleSave
            }
          >
            <header
              className={
                styles.modalHeader
              }
            >
              <div>
                <div
                  className={
                    styles.modalEyebrow
                  }
                >
                  {selectedItem
                    .content_type ===
                  'gallery'
                    ? 'Galería'
                    : 'Artículo'}
                </div>

                <h2>
                  Editar SEO
                </h2>

                <p>
                  {
                    selectedItem.title
                  }
                </p>
              </div>

              <button
                type="button"
                className={
                  styles.closeButton
                }
                onClick={
                  closeEditor
                }
                disabled={
                  saving ||
                  uploadingImage
                }
              >
                <X size={21} />
              </button>
            </header>

            <div
              className={
                styles.modalBody
              }
            >
              <section
                className={
                  styles.socialSection
                }
              >
                <div
                  className={
                    styles.sectionTitle
                  }
                >
                  Vista previa social
                </div>

                <SocialPreview
                  item={{
                    ...selectedItem,

                    ...form,
                  }}
                />

                <label
                  className={
                    styles.field
                  }
                >
                  <span>
                    Título para compartir
                  </span>

                  <small>
                    {form.social_title
                      .length}
                    /100
                  </small>

                  <input
                    type="text"
                    value={
                      form.social_title
                    }
                    onChange={event => {
                      updateField(
                        'social_title',
                        event.target
                          .value
                      );
                    }}
                    maxLength={100}
                    placeholder={
                      selectedItem.title
                    }
                  />
                </label>

                <label
                  className={
                    styles.field
                  }
                >
                  <span>
                    Descripción para compartir
                  </span>

                  <small>
                    {form
                      .social_description
                      .length}
                    /200
                  </small>

                  <textarea
                    value={
                      form.social_description
                    }
                    onChange={event => {
                      updateField(
                        'social_description',
                        event.target
                          .value
                      );
                    }}
                    maxLength={200}
                    rows={3}
                    placeholder={
                      getFallbackDescription(
                        selectedItem
                      ) ||
                      'Descripción de la tarjeta social...'
                    }
                  />
                </label>

                <label
                  className={
                    styles.field
                  }
                >
                  <span>
                    Imagen social
                  </span>

                  <input
                    type="url"
                    value={
                      form.social_image_url
                    }
                    onChange={event => {
                      updateField(
                        'social_image_url',
                        event.target
                          .value
                      );
                    }}
                    placeholder="https://..."
                  />
                </label>

                <label
                  className={
                    styles.uploadSocialButton
                  }
                >
                  {uploadingImage ? (
                    <LoaderCircle
                      size={16}
                      className={
                        styles.spinning
                      }
                    />
                  ) : (
                    <ImageIcon
                      size={16}
                    />
                  )}

                  {uploadingImage
                    ? 'Subiendo...'
                    : 'Seleccionar imagen 1200 × 630'}

                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    disabled={
                      uploadingImage
                    }
                    onChange={
                      handleSocialImageUpload
                    }
                  />
                </label>
              </section>

              <section
                className={
                  styles.seoSection
                }
              >
                <div
                  className={
                    styles.sectionTitle
                  }
                >
                  Opciones de Google
                </div>

                <label
                  className={
                    styles.field
                  }
                >
                  <span>
                    Título SEO
                  </span>

                  <small>
                    {form.seo_title
                      .length}
                    /70
                  </small>

                  <input
                    type="text"
                    value={
                      form.seo_title
                    }
                    onChange={event => {
                      updateField(
                        'seo_title',
                        event.target
                          .value
                      );
                    }}
                    maxLength={70}
                    placeholder={
                      selectedItem.title
                    }
                  />
                </label>

                <label
                  className={
                    styles.field
                  }
                >
                  <span>
                    Descripción SEO
                  </span>

                  <small>
                    {form
                      .seo_description
                      .length}
                    /180
                  </small>

                  <textarea
                    value={
                      form.seo_description
                    }
                    onChange={event => {
                      updateField(
                        'seo_description',
                        event.target
                          .value
                      );
                    }}
                    maxLength={180}
                    rows={4}
                    placeholder={
                      getFallbackDescription(
                        selectedItem
                      ) ||
                      'Descripción que aparecerá en Google...'
                    }
                  />
                </label>

                <div
                  className={
                    styles.googlePreview
                  }
                >
                  <div
                    className={
                      styles.googleUrl
                    }
                  >
                    agorarevista.mx
                  </div>

                  <div
                    className={
                      styles.googleTitle
                    }
                  >
                    {form.seo_title ||
                      selectedItem.title}
                  </div>

                  <p>
                    {form.seo_description ||
                      getFallbackDescription(
                        selectedItem
                      ) ||
                      'Agorá Revista'}
                  </p>
                </div>

                <label
                  className={
                    styles.field
                  }
                >
                  <span>
                    URL pública
                  </span>

                  <input
                    type="text"
                    value={
                      getPublicUrl(
                        selectedItem
                      )
                    }
                    readOnly
                  />
                </label>
              </section>
            </div>

            <footer
              className={
                styles.modalActions
              }
            >
              <button
                type="button"
                className={
                  styles.cancelButton
                }
                onClick={
                  closeEditor
                }
                disabled={
                  saving
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                className={
                  styles.saveButton
                }
                disabled={
                  saving ||
                  uploadingImage
                }
              >
                {saving ? (
                  <LoaderCircle
                    size={16}
                    className={
                      styles.spinning
                    }
                  />
                ) : (
                  <Save size={16} />
                )}

                {saving
                  ? 'Guardando...'
                  : 'Guardar SEO'}
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
}

function SocialPreview({
  item,
}) {
  const title =
    getSocialTitle(item);

  const description =
    getSocialDescription(
      item
    );

  const image =
    getSocialImage(item);

  return (
    <div
      className={
        styles.socialPreview
      }
    >
      <div
        className={
          styles.socialImage
        }
      >
        {image ? (
          <img
            src={image}
            alt=""
          />
        ) : (
          <ImageIcon
            size={34}
          />
        )}
      </div>

      <div
        className={
          styles.socialContent
        }
      >
        <span>
          AGORAREVISTA.MX
        </span>

        <strong>
          {title}
        </strong>

        {description && (
          <p>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
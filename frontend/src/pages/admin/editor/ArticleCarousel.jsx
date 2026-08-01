import {
  Node,
  mergeAttributes,
} from '@tiptap/core';

import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from '@tiptap/react';

import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Link as LinkIcon,
  LoaderCircle,
  Trash2,
  Upload,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  uploadFiles,
} from '../../../api/admin.api';

import styles from './ArticleCarousel.module.css';

const createImageId = () => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID ===
      'function'
  ) {
    return crypto.randomUUID();
  }

  return [
    'carousel',
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2),
  ].join('-');
};

const normalizeUrl = value => {
  const clean =
    String(value || '').trim();

  if (!clean) {
    return '';
  }

  if (
    /^https?:\/\//i.test(clean)
  ) {
    return clean;
  }

  return `https://${clean}`;
};

const normalizeImages = value => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(image => ({
      id:
        image?.id ||
        createImageId(),

      src:
        String(
          image?.src ||
          image?.image_url ||
          ''
        ).trim(),

      alt:
        String(
          image?.alt ||
          image?.alt_text ||
          ''
        ),

      caption:
        String(
          image?.caption ||
          image?.description ||
          ''
        ),
    }))
    .filter(image => image.src);
};

function ArticleCarouselView({
  node,
  updateAttributes,
  selected,
  getPos,
  editor,
}) {
  const fileInputRef =
    useRef(null);

  const carouselRef =
    useRef(null);

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(0);

  const [
    expanded,
    setExpanded,
  ] = useState(
    Boolean(selected)
  );

  const [
    urlInput,
    setUrlInput,
  ] = useState('');

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const images =
    useMemo(
      () =>
        normalizeImages(
          node.attrs.images
        ),
      [node.attrs.images]
    );


  useEffect(() => {
    if (selected) {
      setExpanded(true);
    }
  }, [
    selected,
  ]);


  useEffect(() => {
    const handleOutsidePointerDown =
      event => {
        const carouselElement =
          carouselRef.current;

        if (!carouselElement) {
          return;
        }

        if (
          carouselElement.contains(
            event.target
          )
        ) {
          return;
        }

        setExpanded(false);
      };

    document.addEventListener(
      'pointerdown',
      handleOutsidePointerDown,
      true
    );

    return () => {
      document.removeEventListener(
        'pointerdown',
        handleOutsidePointerDown,
        true
      );
    };
  }, []);

  const selectCarouselNode =
    event => {
      event.stopPropagation();

      setExpanded(true);

      if (
        typeof getPos !==
          'function'
      ) {
        return;
      }

      const position =
        getPos();

      if (
        !Number.isInteger(
          position
        )
      ) {
        return;
      }

      editor
        ?.chain()
        .focus()
        .setNodeSelection(
          position
        )
        .run();
    };

  const activeImage =
    images[activeIndex] ||
    images[0] ||
    null;

  const commitImages =
    nextImages => {
      updateAttributes({
        images:
          normalizeImages(
            nextImages
          ),
      });

      setActiveIndex(
        current =>
          Math.min(
            current,
            Math.max(
              nextImages.length - 1,
              0
            )
          )
      );
    };

  const addExternalUrl = () => {
    const url =
      normalizeUrl(
        urlInput
      );

    if (!url) {
      return;
    }

    commitImages([
      ...images,

      {
        id:
          createImageId(),

        src:
          url,

        alt: '',

        caption: '',
      },
    ]);

    setActiveIndex(
      images.length
    );

    setUrlInput('');
  };

  const uploadImages =
    async event => {
      const files =
        Array.from(
          event.target
            .files ||
          []
        );

      if (
        files.length === 0
      ) {
        return;
      }

      setUploading(true);

      try {
        const response =
          await uploadFiles(
            files,
            'articles/carousels'
          );

        const uploaded =
          Array.isArray(response)
            ? response
            : Array.isArray(
                response?.files
              )
              ? response.files
              : Array.isArray(
                  response?.data
                )
                ? response.data
                : [];

        const nextImages =
          uploaded
            .map(
              (
                result,
                index
              ) => ({
                id:
                  createImageId(),

                src:
                  result?.url ||
                  result?.image_url ||
                  '',

                alt:
                  files[index]
                    ?.name ||
                  '',

                caption: '',
              })
            )
            .filter(
              image =>
                image.src
            );

        if (
          nextImages.length === 0
        ) {
          throw new Error(
            'La API no devolvió URLs de imágenes'
          );
        }

        commitImages([
          ...images,
          ...nextImages,
        ]);

        setActiveIndex(
          images.length
        );
      } catch (error) {
        console.error(
          'No se pudieron subir las imágenes del carrusel:',
          error
        );
      } finally {
        setUploading(false);

        event.target.value =
          '';
      }
    };

  const updateImage =
    (
      imageId,
      field,
      value
    ) => {
      commitImages(
        images.map(
          image =>
            image.id ===
            imageId
              ? {
                  ...image,

                  [field]:
                    value,
                }
              : image
        )
      );
    };

  const removeImage =
    imageId => {
      commitImages(
        images.filter(
          image =>
            image.id !==
            imageId
        )
      );
    };

  const moveImage =
    direction => {
      if (
        images.length < 2
      ) {
        return;
      }

      const targetIndex =
        activeIndex +
        direction;

      if (
        targetIndex < 0 ||
        targetIndex >=
          images.length
      ) {
        return;
      }

      const nextImages = [
        ...images,
      ];

      const [
        movedImage,
      ] =
        nextImages.splice(
          activeIndex,
          1
        );

      nextImages.splice(
        targetIndex,
        0,
        movedImage
      );

      commitImages(
        nextImages
      );

      setActiveIndex(
        targetIndex
      );
    };

  return (
    <NodeViewWrapper
      ref={
        carouselRef
      }
      className={`
        ${styles.node}
        ${
          selected
            ? styles.nodeSelected
            : ''
        }
        ${
          expanded
            ? styles.nodeExpanded
            : styles.nodeCollapsed
        }
      `}
      data-type="article-carousel"
      onClick={
        selectCarouselNode
      }
    >
      {!expanded ? (
        <button
          type="button"
          className={
            styles.collapsedPreview
          }
          onClick={
            selectCarouselNode
          }
        >
          <div
            className={
              styles.collapsedImage
            }
          >
            {images[0]?.src ? (
              <img
                src={
                  images[0].src
                }
                alt={
                  images[0].alt ||
                  ''
                }
              />
            ) : (
              <ImagePlus
                size={28}
              />
            )}

            {images.length > 1 && (
              <span
                className={
                  styles.collapsedCountBadge
                }
              >
                +{
                  images.length -
                  1
                }
              </span>
            )}
          </div>

          <div
            className={
              styles.collapsedInformation
            }
          >
            <strong>
              Carrusel de imágenes
            </strong>

            <span>
              {
                images.length
              }{' '}
              {images.length === 1
                ? 'imagen'
                : 'imágenes'}
            </span>

            {node.attrs
              .generalCaption && (
              <p>
                {
                  node.attrs
                    .generalCaption
                }
              </p>
            )}
          </div>

          <div
            className={
              styles.collapsedAction
            }
          >
            Editar
          </div>
        </button>
      ) : (
        <>
          <div
            className={
              styles.header
            }
          >
            <div>
              <strong>
                Carrusel de imágenes
              </strong>

              <span>
                {images.length}{' '}
                {images.length === 1
                  ? 'imagen'
                  : 'imágenes'}
              </span>
            </div>

            <div
              className={
                styles.headerActions
              }
            >
              <button
                type="button"
                onClick={event => {
                  event.stopPropagation();

                  fileInputRef
                    .current
                    ?.click();
                }}
                disabled={
                  uploading
                }
              >
                {uploading ? (
                  <LoaderCircle
                    size={15}
                  />
                ) : (
                  <Upload
                    size={15}
                  />
                )}

                Subir imágenes
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={
                  uploadImages
                }
              />
            </div>
          </div>

          <div
            className={
              styles.urlRow
            }
            onClick={event => {
              event.stopPropagation();
            }}
          >
            <LinkIcon
              size={16}
            />

            <input
              type="url"
              value={urlInput}
              onChange={event => {
                setUrlInput(
                  event.target.value
                );
              }}
              placeholder="URL directa de imagen o Imgur"
              onKeyDown={event => {
                if (
                  event.key ===
                  'Enter'
                ) {
                  event.preventDefault();
                  addExternalUrl();
                }
              }}
            />

            <button
              type="button"
              onClick={
                addExternalUrl
              }
            >
              Agregar
            </button>
          </div>

          {activeImage ? (
            <>
              <div
                className={
                  styles.preview
                }
                onClick={event => {
                  event.stopPropagation();
                }}
              >
                <img
                  src={
                    activeImage.src
                  }
                  alt={
                    activeImage.alt ||
                    ''
                  }
                />

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      className={`${styles.arrow} ${styles.arrowLeft}`}
                      onClick={event => {
                        event.stopPropagation();

                        setActiveIndex(
                          current =>
                            (
                              current -
                              1 +
                              images.length
                            ) %
                            images.length
                        );
                      }}
                    >
                      <ChevronLeft
                        size={22}
                      />
                    </button>

                    <button
                      type="button"
                      className={`${styles.arrow} ${styles.arrowRight}`}
                      onClick={event => {
                        event.stopPropagation();

                        setActiveIndex(
                          current =>
                            (
                              current +
                              1
                            ) %
                            images.length
                        );
                      }}
                    >
                      <ChevronRight
                        size={22}
                      />
                    </button>
                  </>
                )}
              </div>

              <div
                className={
                  styles.counter
                }
              >
                {activeIndex + 1}
                {' / '}
                {images.length}
              </div>

              <div
                className={
                  styles.imageFields
                }
                onClick={event => {
                  event.stopPropagation();
                }}
              >
                <label>
                  <span>
                    Texto alternativo
                  </span>

                  <input
                    type="text"
                    value={
                      activeImage.alt
                    }
                    onChange={event => {
                      updateImage(
                        activeImage.id,
                        'alt',
                        event.target
                          .value
                      );
                    }}
                    placeholder="Describe la imagen"
                  />
                </label>

                <label>
                  <span>
                    Pie de esta fotografía
                  </span>

                  <textarea
                    value={
                      activeImage.caption
                    }
                    onChange={event => {
                      updateImage(
                        activeImage.id,
                        'caption',
                        event.target
                          .value
                      );
                    }}
                    placeholder="Pie individual opcional"
                  />
                </label>
              </div>

              <div
                className={
                  styles.imageActions
                }
                onClick={event => {
                  event.stopPropagation();
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    moveImage(-1);
                  }}
                  disabled={
                    activeIndex ===
                    0
                  }
                >
                  Mover a la izquierda
                </button>

                <button
                  type="button"
                  onClick={() => {
                    moveImage(1);
                  }}
                  disabled={
                    activeIndex ===
                    images.length -
                    1
                  }
                >
                  Mover a la derecha
                </button>

                <button
                  type="button"
                  className={
                    styles.removeButton
                  }
                  onClick={() => {
                    removeImage(
                      activeImage.id
                    );
                  }}
                >
                  <Trash2
                    size={14}
                  />

                  Eliminar imagen
                </button>
              </div>

              <div
                className={
                  styles.thumbnails
                }
                onClick={event => {
                  event.stopPropagation();
                }}
              >
                {images.map(
                  (
                    image,
                    index
                  ) => (
                    <button
                      type="button"
                      key={
                        image.id
                      }
                      className={
                        index ===
                        activeIndex
                          ? styles.thumbnailActive
                          : ''
                      }
                      onClick={() => {
                        setActiveIndex(
                          index
                        );
                      }}
                    >
                      <img
                        src={
                          image.src
                        }
                        alt=""
                      />
                    </button>
                  )
                )}
              </div>
            </>
          ) : (
            <button
              type="button"
              className={
                styles.empty
              }
              onClick={event => {
                event.stopPropagation();

                fileInputRef
                  .current
                  ?.click();
              }}
            >
              <ImagePlus
                size={32}
              />

              <strong>
                Agrega fotografías
              </strong>

              <span>
                Puedes subir varias o utilizar URLs.
              </span>
            </button>
          )}

          <label
            className={
              styles.generalCaption
            }
            onClick={event => {
              event.stopPropagation();
            }}
          >
            <span>
              Pie general del carrusel
            </span>

            <textarea
              value={
                node.attrs
                  .generalCaption ||
                ''
              }
              onChange={event => {
                updateAttributes({
                  generalCaption:
                    event.target
                      .value,
                });
              }}
              placeholder="Este texto se muestra una sola vez debajo de todo el carrusel"
            />
          </label>
        </>
      )}
    </NodeViewWrapper>
  );
}

const ArticleCarousel =
  Node.create({
    name:
      'articleCarousel',

    group:
      'block',

    atom:
      true,

    draggable:
      true,

    selectable:
      true,

    addAttributes() {
      return {
        images: {
          default: [],
        },

        generalCaption: {
          default: '',
        },
      };
    },

    parseHTML() {
      return [
        {
          tag:
            'figure[data-article-carousel]',
        },
      ];
    },

    renderHTML({
      HTMLAttributes,
      node,
    }) {
      const images =
        normalizeImages(
          node.attrs.images
        );

      const generalCaption =
        String(
          node.attrs
            .generalCaption ||
          ''
        );

      const imageSlides =
        images.map(
          (
            image,
            index
          ) => [
            'div',

            {
              class:
                'article-carousel-slide',

              'data-carousel-index':
                String(index),

              'data-active':
                index === 0
                  ? 'true'
                  : 'false',
            },

            [
              'img',

              {
                src:
                  image.src,

                alt:
                  image.alt ||
                  '',

                loading:
                  'lazy',
              },
            ],

            image.caption
              ? [
                  'figcaption',

                  {
                    class:
                      'article-carousel-image-caption',
                  },

                  image.caption,
                ]
              : [
                  'span',

                  {
                    class:
                      'article-carousel-empty-caption',

                    'aria-hidden':
                      'true',
                  },
                ],
          ]
        );

      const dots =
        images.map(
          (
            image,
            index
          ) => [
            'button',

            {
              type:
                'button',

              class:
                'article-carousel-dot',

              'data-carousel-dot':
                String(index),

              'aria-label':
                `Ver imagen ${index + 1}`,

              'data-active':
                index === 0
                  ? 'true'
                  : 'false',
            },
          ]
        );

      return [
        'figure',

        mergeAttributes(
          HTMLAttributes,
          {
            class:
              'article-carousel-node',

            'data-article-carousel':
              'true',

            'data-carousel-active':
              '0',
          }
        ),

        [
          'div',

          {
            class:
              'article-carousel-viewport',
          },

          [
            'button',

            {
              type:
                'button',

              class:
                'article-carousel-arrow article-carousel-arrow-left',

              'data-carousel-previous':
                'true',

              'aria-label':
                'Fotografía anterior',
            },

            '‹',
          ],

          [
            'div',

            {
              class:
                'article-carousel-track',
            },

            ...imageSlides,
          ],

          [
            'button',

            {
              type:
                'button',

              class:
                'article-carousel-arrow article-carousel-arrow-right',

              'data-carousel-next':
                'true',

              'aria-label':
                'Fotografía siguiente',
            },

            '›',
          ],
        ],

        [
          'div',

          {
            class:
              'article-carousel-dots',
          },

          ...dots,
        ],

        generalCaption
          ? [
              'figcaption',

              {
                class:
                  'article-carousel-general-caption',
              },

              generalCaption,
            ]
          : [
              'span',

              {
                class:
                  'article-carousel-empty-caption',

                'aria-hidden':
                  'true',
              },
            ],
      ];
    },

    addNodeView() {
      return ReactNodeViewRenderer(
        ArticleCarouselView
      );
    },
  });

export default ArticleCarousel;
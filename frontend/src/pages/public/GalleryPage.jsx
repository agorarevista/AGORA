import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Link,
  useParams,
} from 'react-router-dom';

import {
  createPortal,
} from 'react-dom';

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Images,
  Landmark,
  Mail,
  Maximize2,
  X,
} from 'lucide-react';

import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaYoutube,
} from 'react-icons/fa6';

import {
  getGallery,
} from '../../api/galleries.api';

import {
  formatDate,
} from '../../utils/formatDate';

import GalleryMuseum from '../../components/gallery/GalleryMuseum/GalleryMuseum';

import styles from './GalleryPage.module.css';

const normalizeSocialUrl = value => {
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

const normalizePhotos = gallery => {
  const source =
    Array.isArray(
      gallery?.gallery_photos
    )
      ? gallery.gallery_photos
      : Array.isArray(
            gallery?.photos
          )
        ? gallery.photos
        : [];

  return [...source].sort(
    (firstPhoto, secondPhoto) => {
      return (
        Number(
          firstPhoto.display_order ||
          0
        ) -
        Number(
          secondPhoto.display_order ||
          0
        )
      );
    }
  );
};

const getPhotoAuthor = (
  photo,
  galleryAuthor
) => {
  return (
    photo?.photo_author ||
    galleryAuthor?.name ||
    'Agorá Revista'
  );
};

export default function GalleryPage() {
  const {
    slug,
  } = useParams();

  const [
    gallery,
    setGallery,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(0);

const [
  expandedPhoto,
  setExpandedPhoto,
] = useState(null);

const [
  expandedPhotoSource,
  setExpandedPhotoSource,
] = useState(null);

const [
  expandedAuthor,
  setExpandedAuthor,
] = useState(null);

const [
  viewMode,
  setViewMode,
] = useState('album');

  const [
    isDragging,
    setIsDragging,
  ] = useState(false);

  const [
    carouselMotion,
    setCarouselMotion,
  ] = useState({
    direction: 'next',
    key: 0,
  });

  const dragStartXRef =
    useRef(0);

const dragDistanceRef =
  useRef(0);

const suppressSlideClickRef =
  useRef(false);

const wheelLockedRef =
  useRef(false);

const museumRef =
  useRef(null);

  useEffect(() => {
    let mounted = true;

    const loadGallery =
      async () => {
        setLoading(true);
        setError('');

        try {
          const data =
            await getGallery(
              slug
            );

          if (!mounted) {
            return;
          }

          setGallery(data);
          setActiveIndex(0);
        } catch (requestError) {
          console.error(
            'ERROR cargando galería:',
            requestError
          );

          if (mounted) {
            setError(
              requestError?.response
                ?.data?.error ||
              requestError?.response
                ?.data?.message ||
              'No fue posible cargar esta galería.'
            );
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    loadGallery();

    return () => {
      mounted = false;
    };
  }, [slug]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'auto',
    });
  }, [slug]);

  const author =
    gallery?.collaborators ||
    gallery?.collaborator ||
    null;

  const photos =
    useMemo(
      () =>
        normalizePhotos(
          gallery
        ),
      [gallery]
    );

  const activePhoto =
    photos[
      activeIndex
    ] ||
    null;

  const goToPhoto =
    useCallback(
      nextIndex => {
        if (
          photos.length === 0
        ) {
          return;
        }

        const normalizedIndex =
          (
            nextIndex +
            photos.length
          ) %
          photos.length;

        setActiveIndex(
          normalizedIndex
        );
      },
      [photos.length]
    );

  const goToPhotoAnimated =
    useCallback(
      nextIndex => {
        if (
          photos.length === 0
        ) {
          return;
        }

        const normalizedIndex =
          (
            nextIndex +
            photos.length
          ) %
          photos.length;

        if (
          normalizedIndex ===
          activeIndex
        ) {
          return;
        }

        const forwardDistance =
          (
            normalizedIndex -
            activeIndex +
            photos.length
          ) %
          photos.length;

        const backwardDistance =
          (
            activeIndex -
            normalizedIndex +
            photos.length
          ) %
          photos.length;

        const direction =
          forwardDistance <=
          backwardDistance
            ? 'next'
            : 'previous';

        setCarouselMotion(
          currentMotion => ({
            direction,
            key:
              currentMotion.key +
              1,
          })
        );

        goToPhoto(
          normalizedIndex
        );
      },
      [
        activeIndex,
        photos.length,
        goToPhoto,
      ]
    );

  const goPrevious =
    useCallback(() => {
      goToPhotoAnimated(
        activeIndex - 1
      );
    }, [
      activeIndex,
      goToPhotoAnimated,
    ]);

  const goNext =
    useCallback(() => {
      goToPhotoAnimated(
        activeIndex + 1
      );
    }, [
      activeIndex,
      goToPhotoAnimated,
    ]);

  const closeExpandedPhoto =
    useCallback(() => {
      const shouldResumeMuseum =
        expandedPhotoSource ===
          'museum' &&
        viewMode ===
          'museum';

      if (
        shouldResumeMuseum
      ) {
        museumRef.current
          ?.resumeFromPreview?.();
      }

      setExpandedPhoto(
        null
      );

      setExpandedPhotoSource(
        null
      );
    }, [
      expandedPhotoSource,
      viewMode,
    ]);

  const closeExpandedAuthor =
    useCallback(() => {
      if (
        viewMode ===
        'museum'
      ) {
        museumRef.current
          ?.resumeFromPreview?.();
      }

      setExpandedAuthor(
        null
      );
    }, [
      viewMode,
    ]);

  useEffect(() => {
    const handleKeyDown =
      event => {
        if (
          expandedAuthor &&
          event.key ===
            'Escape'
        ) {
          event.preventDefault();
          event.stopPropagation();

          closeExpandedAuthor();

          return;
        }

        if (expandedPhoto) {
if (
  event.key ===
  'Escape'
) {
  event.preventDefault();
  event.stopPropagation();

  closeExpandedPhoto();

  return;
}

          if (
            event.key ===
            'ArrowLeft'
          ) {
            const currentIndex =
              photos.findIndex(
                photo =>
                  photo.id ===
                  expandedPhoto.id
              );

            const nextIndex =
              (
                currentIndex -
                1 +
                photos.length
              ) %
              photos.length;

            setExpandedPhoto(
              photos[
                nextIndex
              ]
            );
          }

          if (
            event.key ===
            'ArrowRight'
          ) {
            const currentIndex =
              photos.findIndex(
                photo =>
                  photo.id ===
                  expandedPhoto.id
              );

            const nextIndex =
              (
                currentIndex +
                1
              ) %
              photos.length;

            setExpandedPhoto(
              photos[
                nextIndex
              ]
            );
          }

          return;
        }

        if (
          viewMode !==
          'album'
        ) {
          return;
        }

        if (
          event.key ===
          'ArrowLeft'
        ) {
          goPrevious();
        }

        if (
          event.key ===
          'ArrowRight'
        ) {
          goNext();
        }
      };

    document.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
}, [
  expandedPhoto,
  expandedAuthor,
  photos,
  viewMode,
  goPrevious,
  goNext,
  closeExpandedPhoto,
  closeExpandedAuthor,
]);

  useEffect(() => {
    if (
      !expandedPhoto &&
      !expandedAuthor
    ) {
      return undefined;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      'hidden';

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    expandedPhoto,
    expandedAuthor,
  ]);

const handleCarouselWheel =
  event => {
    /*
     * El scroll vertical debe continuar
     * moviendo la página normalmente.
     *
     * El carrusel solo responderá a:
     * - desplazamiento horizontal real;
     * - Shift + rueda del mouse.
     */
    const horizontalDelta =
      Math.abs(event.deltaX);

    const verticalDelta =
      Math.abs(event.deltaY);

    const isHorizontalGesture =
      horizontalDelta >
      verticalDelta;

    const isShiftWheel =
      event.shiftKey &&
      verticalDelta > 8;

    if (
      !isHorizontalGesture &&
      !isShiftWheel
    ) {
      return;
    }

    if (
      wheelLockedRef.current
    ) {
      return;
    }

    const movement =
      isHorizontalGesture
        ? event.deltaX
        : event.deltaY;

    if (
      Math.abs(movement) <
      8
    ) {
      return;
    }

    event.preventDefault();

    wheelLockedRef.current =
      true;

    if (movement > 0) {
      goNext();
    } else {
      goPrevious();
    }

    window.setTimeout(
      () => {
        wheelLockedRef.current =
          false;
      },
      320
    );
  };

const handlePointerDown =
  event => {
    if (
      event.button !== undefined &&
      event.button !== 0
    ) {
      return;
    }

    setIsDragging(true);

    dragStartXRef.current =
      event.clientX;

    dragDistanceRef.current =
      0;

    suppressSlideClickRef.current =
      false;

    event.currentTarget
      .setPointerCapture?.(
        event.pointerId
      );
  };

const handlePointerMove =
  event => {
    if (!isDragging) {
      return;
    }

    const distance =
      event.clientX -
      dragStartXRef.current;

    dragDistanceRef.current =
      distance;

    if (
      Math.abs(distance) >
      8
    ) {
      suppressSlideClickRef.current =
        true;
    }
  };

const handlePointerEnd =
  event => {
    if (!isDragging) {
      return;
    }

    setIsDragging(false);

    event.currentTarget
      .releasePointerCapture?.(
        event.pointerId
      );

    const distance =
      dragDistanceRef.current;

    if (
      Math.abs(distance) >
      55
    ) {
      if (distance > 0) {
        goPrevious();
      } else {
        goNext();
      }
    }

    window.setTimeout(
      () => {
        suppressSlideClickRef.current =
          false;
      },
      80
    );
  };

const getPhotoRatio =
  photo => {
    const width =
      Number(
        photo?.width
      );

    const height =
      Number(
        photo?.height
      );

    if (
      width > 0 &&
      height > 0
    ) {
      return width / height;
    }

    return 4 / 3;
  };

const openPhoto = (
  photo,
  source = 'album'
) => {
  if (!photo) {
    return;
  }

  setExpandedPhotoSource(
    source
  );

  setExpandedPhoto(
    photo
  );
};

const openMuseumPhoto =
  photo => {
    const index =
      photos.findIndex(
        currentPhoto =>
          currentPhoto.id ===
          photo.id
      );

    if (index >= 0) {
      setActiveIndex(
        index
      );
    }

    openPhoto(
      photo,
      'museum'
    );
  };

 

  if (loading) {
    return (
      <GalleryState
        message="Cargando galería..."
      />
    );
  }

  if (
    error ||
    !gallery
  ) {
    return (
      <GalleryState
        title="Galería no encontrada"
        message={error}
        showBackLink
      />
    );
  }

  return (
    <main
      className={
        styles.page
      }
    >
      <header
        className={
          styles.header
        }
      >
        <Link
          to="/galeria"
          className={
            styles.backLink
          }
        >
          <ArrowLeft
            size={14}
          />

          Galería
        </Link>

        <span
          className={
            styles.eyebrow
          }
        >
          Álbum fotográfico
        </span>

        <h1>
          {gallery.title}
        </h1>

        {gallery.subtitle && (
          <p
            className={
              styles.subtitle
            }
          >
            {gallery.subtitle}
          </p>
        )}

        <div
          className={
            styles.meta
          }
        >
          <span>
            {author?.name ||
              'Agorá Revista'}
          </span>

          {gallery.published_at && (
            <>
              <span
                aria-hidden="true"
              >
                ·
              </span>

              <span>
                {formatDate(
                  gallery.published_at
                )}
              </span>
            </>
          )}

          <span
            aria-hidden="true"
          >
            ·
          </span>

          <span
            className={
              styles.photoTotal
            }
          >
            <Images
              size={14}
            />

            {photos.length}{' '}
            {photos.length === 1
              ? 'fotografía'
              : 'fotografías'}
          </span>
        </div>
      </header>

      {gallery.excerpt && (
        <p
          className={
            styles.excerpt
          }
        >
          {gallery.excerpt}
        </p>
      )}

      <div
        className={
          styles.viewSwitcher
        }
        role="tablist"
        aria-label="Vista de la galería"
      >
        <button
          type="button"
          className={`${styles.viewButton} ${
            viewMode ===
            'album'
              ? styles.viewButtonActive
              : ''
          }`}
          onClick={() => {
            setViewMode(
              'album'
            );
          }}
          aria-label="Vista álbum"
          title="Vista álbum"
          aria-selected={
            viewMode ===
            'album'
          }
        >
          <Grid3X3
            size={19}
          />
        </button>

        <button
          type="button"
          className={`${styles.viewButton} ${
            viewMode ===
            'museum'
              ? styles.viewButtonActive
              : ''
          }`}
          onClick={() => {
            setViewMode(
              'museum'
            );
          }}
          aria-label="Vista museo"
          title="Vista museo 3D"
          aria-selected={
            viewMode ===
            'museum'
          }
        >
          <Landmark
            size={20}
          />
        </button>
      </div>

      {viewMode === 'album' ? (
        <section
          className={
            styles.albumSection
          }
        >
          {photos.length === 0 ? (
            <div
              className={
                styles.emptyAlbum
              }
            >
              <Images
                size={42}
              />

              <h2>
                Este álbum todavía no tiene fotografías
              </h2>
            </div>
          ) : (
            <>
<div
  className={
    styles.carouselShell
  }
  onWheel={
    handleCarouselWheel
  }
  data-dragging={
    isDragging
      ? 'true'
      : 'false'
  }
>
  <button
    type="button"
    className={`${styles.carouselArrow} ${styles.carouselArrowLeft}`}
    onPointerDown={event => {
      event.stopPropagation();
    }}
    onClick={event => {
      event.preventDefault();
      event.stopPropagation();

      goPrevious();
    }}
    aria-label="Fotografía anterior"
  >
    <ChevronLeft
      size={25}
    />
  </button>

  <button
    type="button"
    className={`${styles.carouselArrow} ${styles.carouselArrowRight}`}
    onPointerDown={event => {
      event.stopPropagation();
    }}
    onClick={event => {
      event.preventDefault();
      event.stopPropagation();

      goNext();
    }}
    aria-label="Fotografía siguiente"
  >
    <ChevronRight
      size={25}
    />
  </button>

<div
  key={
    carouselMotion.key
  }
  className={`${styles.carouselTrack} ${
    carouselMotion.direction ===
    'next'
      ? styles.carouselTrackNext
      : styles.carouselTrackPrevious
  }`}
>
    {[
      -2,
      -1,
      0,
      1,
      2,
    ].map(offset => {
      const photoIndex =
        (
          activeIndex +
          offset +
          photos.length
        ) %
        photos.length;

      const photo =
        photos[
          photoIndex
        ];

      const isActive =
        offset === 0;

      const photoRatio =
        getPhotoRatio(
          photo
        );

      const slideWidth =
        photoRatio < 0.9
          ? 'min(38vw, 470px)'
          : photoRatio > 1.65
            ? 'min(64vw, 820px)'
            : 'min(56vw, 700px)';

      return (
<button
  type="button"
  key={`${photo.id || photo.image_url}-${offset}`}
  className={`${styles.carouselSlide} ${
    isActive
      ? styles.carouselSlideActive
      : ''
  }`}
  data-offset={
    offset
  }
  style={{
    width:
      slideWidth,

    aspectRatio:
      photoRatio,
  }}
  onPointerDown={event => {
    event.stopPropagation();
  }}
  onPointerUp={event => {
    event.stopPropagation();
  }}
  onClick={event => {
    event.preventDefault();
    event.stopPropagation();

    if (isActive) {
      openPhoto(
        photo,
        'album'
      );

      return;
    }

    goToPhotoAnimated(
      photoIndex
    );
  }}
  aria-label={
    isActive
      ? `Ampliar ${photo.title || `fotografía ${photoIndex + 1}`}`
      : `Ver fotografía ${photoIndex + 1}`
  }
>
          <img
            src={
              photo.image_url
            }
            alt={
              photo.alt_text ||
              photo.title ||
              `Fotografía ${photoIndex + 1}`
            }
            draggable="false"
          />

          {isActive && (
            <span
              className={
                styles.expandIndicator
              }
            >
              <Maximize2
                size={15}
              />
            </span>
          )}
        </button>
      );
    })}
  </div>
</div>

              <div
                className={
                  styles.photoInformation
                }
              >
                <div
                  className={
                    styles.photoPosition
                  }
                >
                  {String(
                    activeIndex +
                    1
                  ).padStart(
                    2,
                    '0'
                  )}

                  <span>/</span>

                  {String(
                    photos.length
                  ).padStart(
                    2,
                    '0'
                  )}
                </div>

                <div
                  className={
                    styles.photoText
                  }
                >
                  <h2>
                    {activePhoto?.title ||
                      `Fotografía ${activeIndex + 1}`}
                  </h2>

                  {activePhoto?.description && (
                    <p>
                      {
                        activePhoto.description
                      }
                    </p>
                  )}

                  <span
                    className={
                      styles.photoCredit
                    }
                  >
                    {getPhotoAuthor(
                      activePhoto,
                      author
                    )}
                  </span>
                </div>
              </div>

              <div
                className={
                  styles.dots
                }
                aria-label="Selector de fotografías"
              >
                {photos.map(
                  (
                    photo,
                    index
                  ) => (
                    <button
                      type="button"
                      key={
                        photo.id ||
                        photo.image_url
                      }
                      className={
                        index ===
                        activeIndex
                          ? styles.dotActive
                          : ''
                      }
                      onClick={() => {
                        goToPhotoAnimated(
                          index
                        );
                      }}
                      aria-label={`Ir a fotografía ${index + 1}`}
                    />
                  )
                )}
              </div>
            </>
          )}
        </section>
      ) : (
        <section
          className={
            styles.museumSection
          }
        >
<GalleryMuseum
  ref={
    museumRef
  }
  photos={
    photos
  }
  seed={
    gallery.museum_seed ||
    gallery.id ||
    gallery.slug
  }
  author={
    author
  }
  onPhotoClick={
    openMuseumPhoto
  }
  onAuthorClick={
    selectedAuthor => {
      setExpandedAuthor(
        selectedAuthor
      );
    }
  }
  paused={
    (
      Boolean(
        expandedPhoto
      ) &&
      expandedPhotoSource ===
        'museum'
    ) ||
    Boolean(
      expandedAuthor
    )
  }
/>
        </section>
      )}

      <GalleryAuthorCard
        author={author}
      />

{expandedPhoto &&
  createPortal(
    <PhotoModal
      photo={
        expandedPhoto
      }
      photos={
        photos
      }
      galleryAuthor={
        author
      }
      onClose={
        closeExpandedPhoto
      }
      onChange={
        setExpandedPhoto
      }
    />,
    document.body
  )}

{expandedAuthor &&
  createPortal(
    <MuseumAuthorModal
      author={
        expandedAuthor
      }
      onClose={
        closeExpandedAuthor
      }
    />,
    document.body
  )}
    </main>
  );
}

function GalleryAuthorCard({
  author,
}) {
  if (!author) {
    return null;
  }

  const socials =
    author.social_links ||
    {};

  const socialItems = [
    {
      key: 'instagram',
      label: 'Instagram',
      icon:
        FaInstagram,
      url:
        socials.instagram,
    },
    {
      key: 'facebook',
      label: 'Facebook',
      icon:
        FaFacebookF,
      url:
        socials.facebook,
    },
    {
      key: 'youtube',
      label: 'YouTube',
      icon:
        FaYoutube,
      url:
        socials.youtube,
    },
    {
      key: 'tiktok',
      label: 'TikTok',
      icon:
        FaTiktok,
      url:
        socials.tiktok,
    },
  ].filter(
    item =>
      Boolean(
        item.url
      )
  );

  return (
    <section
      className={
        styles.authorSection
      }
    >
      <Link
        to={`/colaborador/${author.slug}`}
        className={
          styles.authorMainLink
        }
      >
        <div
          className={
            styles.authorPhoto
          }
        >
          {author.photo_url ? (
            <img
              src={
                author.photo_url
              }
              alt={
                author.name
              }
            />
          ) : (
            <span>
              {author.name
                ? author.name
                    .charAt(0)
                    .toUpperCase()
                : 'A'}
            </span>
          )}
        </div>

        <span
          className={
            styles.authorEyebrow
          }
        >
          Sobre el autor
        </span>

        <h2
          className={
            styles.authorName
          }
        >
          {author.name}
        </h2>
      </Link>

      <div
        className={
          styles.authorActions
        }
      >
        {socialItems.map(
          item => {
            const Icon =
              item.icon;

            return (
              <a
                key={
                  item.key
                }
                href={
                  normalizeSocialUrl(
                    item.url
                  )
                }
                target="_blank"
                rel="noopener noreferrer"
                title={
                  item.label
                }
                aria-label={
                  item.label
                }
              >
                <Icon
                  size={22}
                />
              </a>
            );
          }
        )}

        {author.email && (
          <a
            href={`mailto:${author.email}`}
            title="Correo"
            aria-label="Correo"
          >
            <Mail
              size={22}
            />
          </a>
        )}
      </div>
    </section>
  );
}

function PhotoModal({
  photo,
  photos,
  galleryAuthor,
  onClose,
  onChange,
}) {
  const currentIndex =
    photos.findIndex(
      currentPhoto =>
        currentPhoto.id ===
        photo.id
    );

  const goPrevious =
    () => {
      const nextIndex =
        (
          currentIndex -
          1 +
          photos.length
        ) %
        photos.length;

      onChange(
        photos[
          nextIndex
        ]
      );
    };

  const goNext =
    () => {
      const nextIndex =
        (
          currentIndex +
          1
        ) %
        photos.length;

      onChange(
        photos[
          nextIndex
        ]
      );
    };

  return (
<div
  className={
    styles.modalBackdrop
  }
  role="dialog"
  aria-modal="true"
  aria-label="Visor de fotografía"
  onPointerDown={event => {
    event.stopPropagation();
  }}
  onPointerUp={event => {
    event.stopPropagation();
  }}
  onClick={event => {
    event.stopPropagation();

    if (
      event.target ===
      event.currentTarget
    ) {
      onClose();
    }
  }}
  onKeyDown={event => {
    event.stopPropagation();
  }}
>
      <button
        type="button"
        className={
          styles.modalClose
        }
        onPointerDown={event => {
          event.stopPropagation();
        }}
        onPointerUp={event => {
          event.stopPropagation();
        }}
        onClick={event => {
          event.stopPropagation();

          onClose();
        }}
        aria-label="Cerrar fotografía"
      >
        <X
          size={24}
        />
      </button>

      {photos.length > 1 && (
        <>
          <button
            type="button"
            className={`${styles.modalArrow} ${styles.modalArrowLeft}`}
            onClick={
              goPrevious
            }
            aria-label="Fotografía anterior"
          >
            <ChevronLeft
              size={28}
            />
          </button>

          <button
            type="button"
            className={`${styles.modalArrow} ${styles.modalArrowRight}`}
            onClick={
              goNext
            }
            aria-label="Fotografía siguiente"
          >
            <ChevronRight
              size={28}
            />
          </button>
        </>
      )}

      <div
        className={
          styles.modalContent
        }
      >
        <img
          src={
            photo.image_url
          }
          alt={
            photo.alt_text ||
            photo.title ||
            'Fotografía'
          }
        />

        <aside
          className={
            styles.photoComment
          }
        >
          <span
            className={
              styles.photoCommentPosition
            }
          >
            {String(
              currentIndex +
              1
            ).padStart(
              2,
              '0'
            )}

            {' / '}

            {String(
              photos.length
            ).padStart(
              2,
              '0'
            )}
          </span>

          <h2>
            {photo.title ||
              `Fotografía ${currentIndex + 1}`}
          </h2>

          {photo.description && (
            <p>
              {photo.description}
            </p>
          )}

          <strong>
            {getPhotoAuthor(
              photo,
              galleryAuthor
            )}
          </strong>
        </aside>
      </div>
    </div>
  );
}
function MuseumAuthorModal({
  author,
  onClose,
}) {
  const socials =
    author?.social_links ||
    {};

  const socialItems = [
    {
      key: 'instagram',
      label: 'Instagram',
      icon:
        FaInstagram,
      url:
        socials.instagram,
    },
    {
      key: 'facebook',
      label: 'Facebook',
      icon:
        FaFacebookF,
      url:
        socials.facebook,
    },
    {
      key: 'youtube',
      label: 'YouTube',
      icon:
        FaYoutube,
      url:
        socials.youtube,
    },
    {
      key: 'tiktok',
      label: 'TikTok',
      icon:
        FaTiktok,
      url:
        socials.tiktok,
    },
  ].filter(
    item =>
      Boolean(
        item.url
      )
  );

  const biography =
    author?.bio ||
    author?.biography ||
    author?.semblance ||
    author?.description ||
    'Este autor forma parte de las voces y miradas que construyen Agorá Revista.';

  return (
    <div
      className={
        styles.authorModalBackdrop
      }
      role="dialog"
      aria-modal="true"
      aria-label={`Semblanza de ${author?.name || 'autor'}`}
      onPointerDown={event => {
        event.stopPropagation();
      }}
      onPointerUp={event => {
        event.stopPropagation();
      }}
      onClick={event => {
        event.stopPropagation();

        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <button
        type="button"
        className={
          styles.authorModalClose
        }
        onPointerDown={event => {
          event.stopPropagation();
        }}
        onPointerUp={event => {
          event.stopPropagation();
        }}
        onClick={event => {
          event.stopPropagation();

          onClose();
        }}
        aria-label="Cerrar semblanza"
      >
        <X
          size={24}
        />
      </button>

      <article
        className={
          styles.authorModalCard
        }
      >
        <div
          className={
            styles.authorModalImage
          }
        >
          {author?.photo_url ? (
            <img
              src={
                author.photo_url
              }
              alt={
                author.name
              }
            />
          ) : (
            <span>
              {String(
                author?.name ||
                'A'
              )
                .charAt(0)
                .toUpperCase()}
            </span>
          )}
        </div>

        <div
          className={
            styles.authorModalInformation
          }
        >
          <span
            className={
              styles.authorModalEyebrow
            }
          >
            El autor
          </span>

          <h2>
            {author?.name ||
              'Agorá Revista'}
          </h2>

          <p>
            {biography}
          </p>

          <div
            className={
              styles.authorModalActions
            }
          >
            {socialItems.map(
              item => {
                const Icon =
                  item.icon;

                return (
                  <a
                    key={
                      item.key
                    }
                    href={
                      normalizeSocialUrl(
                        item.url
                      )
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    title={
                      item.label
                    }
                    aria-label={
                      item.label
                    }
                  >
                    <Icon
                      size={20}
                    />
                  </a>
                );
              }
            )}

            {author?.email && (
              <a
                href={`mailto:${author.email}`}
                title="Correo"
                aria-label="Correo"
              >
                <Mail
                  size={20}
                />
              </a>
            )}
          </div>

          {author?.slug && (
            <Link
              to={`/colaborador/${author.slug}`}
              className={
                styles.authorModalProfileLink
              }
            >
              Ver perfil completo
            </Link>
          )}
        </div>
      </article>
    </div>
  );
}
function GalleryState({
  title = '',
  message = '',
  showBackLink = false,
}) {
  return (
    <div
      className={
        styles.state
      }
    >
      <span>Λ</span>

      {title && (
        <h1>
          {title}
        </h1>
      )}

      {message && (
        <p>
          {message}
        </p>
      )}

      {showBackLink && (
        <Link to="/galeria">
          Volver a Galería
        </Link>
      )}
    </div>
  );
}
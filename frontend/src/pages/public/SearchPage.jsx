import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Link,
  useSearchParams,
} from 'react-router-dom';

import {
  motion,
} from 'framer-motion';

import {
  searchArticles,
} from '../../api/articles.api';

import {
  searchCollaborators,
} from '../../api/collaborators.api';

import {
  searchGalleries,
} from '../../api/galleries.api';

import {
  formatDate,
} from '../../utils/formatDate';

import {
  Search,
  Clock,
  Eye,
  X,
  User,
  Images,
  Globe,
  Mail,
} from 'lucide-react';

import {
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaTiktok,
  FaLinkedinIn,
} from 'react-icons/fa6';

import styles from './SearchPage.module.css';

const getContentPath =
  content => {
    return content
      ?.content_type ===
      'gallery'
      ? `/galeria/${content.slug}`
      : `/articulos/${content.slug}`;
  };

const getContentDate =
  content => {
    const timestamp =
      new Date(
        content?.published_at ||
        content?.created_at ||
        0
      ).getTime();

    return Number.isFinite(
      timestamp
    )
      ? timestamp
      : 0;
  };

const normalizeArticles =
  articles => {
    return (
      Array.isArray(articles)
        ? articles
        : []
    ).map(
      article => ({
        ...article,

        content_type:
          'article',
      })
    );
  };

const normalizeGalleries =
  galleries => {
    return (
      Array.isArray(galleries)
        ? galleries
        : []
    ).map(
      gallery => ({
        ...gallery,

        content_type:
          'gallery',
      })
    );
  };

function XSocialIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const getSocialEntries =
  collaborator => {
    const social =
      collaborator
        ?.social_links ||
      {};

    return [
      {
        key:
          'instagram',

        label:
          'Instagram',

        href:
          social.instagram ||
          social.instagram_url ||
          collaborator
            ?.instagram_url ||
          null,

        icon:
          <FaInstagram
            size={18}
          />,
      },

      {
        key:
          'facebook',

        label:
          'Facebook',

        href:
          social.facebook ||
          social.facebook_url ||
          collaborator
            ?.facebook_url ||
          null,

        icon:
          <FaFacebookF
            size={17}
          />,
      },

      {
        key:
          'x',

        label:
          'X',

        href:
          social.x ||
          social.twitter ||
          social.twitter_url ||
          collaborator
            ?.twitter_url ||
          null,

        icon:
          <XSocialIcon
            width={17}
            height={17}
          />,
      },

      {
        key:
          'linkedin',

        label:
          'LinkedIn',

        href:
          social.linkedin ||
          social.linkedin_url ||
          collaborator
            ?.linkedin_url ||
          null,

        icon:
          <FaLinkedinIn
            size={17}
          />,
      },

      {
        key:
          'tiktok',

        label:
          'TikTok',

        href:
          social.tiktok ||
          social.tiktok_url ||
          collaborator
            ?.tiktok_url ||
          null,

        icon:
          <FaTiktok
            size={17}
          />,
      },

      {
        key:
          'youtube',

        label:
          'YouTube',

        href:
          social.youtube ||
          social.youtube_url ||
          collaborator
            ?.youtube_url ||
          null,

        icon:
          <FaYoutube
            size={18}
          />,
      },

      {
        key:
          'website',

        label:
          'Sitio web',

        href:
          social.website ||
          social.portfolio ||
          social.portfolio_url ||
          collaborator
            ?.website_url ||
          null,

        icon:
          <Globe
            size={18}
          />,
      },

      {
        key:
          'email',

        label:
          'Correo',

        href:
          collaborator?.email
            ? `mailto:${collaborator.email}`
            : null,

        icon:
          <Mail
            size={18}
          />,
      },
    ].filter(
      item =>
        Boolean(item.href)
    );
  };

export default function SearchPage() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const q =
    searchParams.get('q') ||
    '';

  const [
    query,
    setQuery,
  ] = useState(q);

  const [
    articles,
    setArticles,
  ] = useState([]);

  const [
    galleries,
    setGalleries,
  ] = useState([]);

  const [
    collaborators,
    setCollaborators,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    searched,
    setSearched,
  ] = useState(false);

  const [
    totalArticles,
    setTotalArticles,
  ] = useState(0);

  const [
    totalGalleries,
    setTotalGalleries,
  ] = useState(0);

  const inputRef =
    useRef(null);

  useEffect(() => {
    inputRef.current
      ?.focus();
  }, []);

  useEffect(() => {
    setQuery(q);
  }, [q]);

  useEffect(() => {
    let mounted = true;

    if (!q.trim()) {
      setArticles([]);
      setGalleries([]);
      setCollaborators([]);
      setTotalArticles(0);
      setTotalGalleries(0);
      setSearched(false);
      setLoading(false);

      return undefined;
    }

    setLoading(true);
    setSearched(true);

    Promise.all([
      searchArticles(
        q,
        {
          limit: 50,
        }
      ).catch(
        () => ({
          data: [],
          total: 0,
        })
      ),

      searchGalleries(
        q,
        {
          limit: 50,
        }
      ).catch(
        () => ({
          data: [],
          total: 0,
        })
      ),

      searchCollaborators(
        q
      ).catch(
        () => []
      ),
    ])
      .then(
        ([
          articleResponse,
          galleryResponse,
          collaboratorResponse,
        ]) => {
          if (!mounted) {
            return;
          }

          setArticles(
            normalizeArticles(
              articleResponse
                ?.data
            )
          );

          setGalleries(
            normalizeGalleries(
              galleryResponse
                ?.data
            )
          );

          setTotalArticles(
            Number(
              articleResponse
                ?.total ||
              0
            )
          );

          setTotalGalleries(
            Number(
              galleryResponse
                ?.total ||
              0
            )
          );

          setCollaborators(
            Array.isArray(
              collaboratorResponse
            )
              ? collaboratorResponse
                  .slice(0, 8)
              : []
          );
        }
      )
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [q]);

  const contents =
    useMemo(() => {
      return [
        ...articles,
        ...galleries,
      ].sort(
        (a, b) =>
          getContentDate(b) -
          getContentDate(a)
      );
    }, [
      articles,
      galleries,
    ]);

  const totalContent =
    totalArticles +
    totalGalleries;

  const totalResults =
    totalContent +
    collaborators.length;

  const handleSubmit =
    event => {
      event.preventDefault();

      const cleanQuery =
        query.trim();

      if (!cleanQuery) {
        return;
      }

      setSearchParams({
        q:
          cleanQuery,
      });
    };

  const clearSearch = () => {
    setQuery('');
    setSearchParams({});
    setArticles([]);
    setGalleries([]);
    setCollaborators([]);
    setTotalArticles(0);
    setTotalGalleries(0);
    setSearched(false);

    inputRef.current
      ?.focus();
  };

  return (
    <div
      className={
        styles.page
      }
    >
      <div
        className={
          styles.hero
        }
      >
        <div
          className={
            styles.heroInner
          }
        >
          <div
            className={
              styles.heroLabel
            }
          >
            Búsqueda
          </div>

          <h1
            className={
              styles.heroTitle
            }
          >
            ¿Qué estás buscando?
          </h1>

          <form
            onSubmit={
              handleSubmit
            }
            className={
              styles.searchForm
            }
          >
            <div
              className={
                styles.searchBox
              }
            >
              <Search
                size={20}
                className={
                  styles.searchIcon
                }
              />

              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={event =>
                  setQuery(
                    event.target
                      .value
                  )
                }
                placeholder="Busca autores, artículos, álbumes o temas..."
                className={
                  styles.searchInput
                }
                autoComplete="off"
              />

              {query && (
                <button
                  type="button"
                  onClick={
                    clearSearch
                  }
                  className={
                    styles.clearBtn
                  }
                  aria-label="Limpiar búsqueda"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              type="submit"
              className={
                styles.searchBtn
              }
            >
              Buscar
            </button>
          </form>

          {q &&
            !loading &&
            searched && (
            <div
              className={
                styles.resultSummary
              }
            >
              {totalResults >
              0 ? (
                <>
                  <strong>
                    {totalResults}
                  </strong>{' '}
                  resultado
                  {totalResults !==
                  1
                    ? 's'
                    : ''}{' '}
                  para{' '}
                  <em>
                    &quot;{q}&quot;
                  </em>
                </>
              ) : (
                <>
                  Sin resultados para{' '}
                  <em>
                    &quot;{q}&quot;
                  </em>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        className={
          styles.meander
        }
      />

      <div
        className={
          styles.body
        }
      >
        {loading ? (
          <SearchSkeleton />
        ) : !searched ? (
          <SearchEmpty />
        ) : totalResults ===
          0 ? (
          <NoResults
            query={q}
          />
        ) : (
          <>
            {collaborators.length >
              0 && (
              <section
                className={
                  styles.section
                }
              >
                <div
                  className={
                    styles.sectionTitle
                  }
                >
                  <User
                    size={15}
                  />

                  Colaboradores

                  <span
                    className={
                      styles.sectionCount
                    }
                  >
                    {
                      collaborators.length
                    }
                  </span>
                </div>

                <div
                  className={
                    styles.collaboratorResults
                  }
                >
                  {collaborators.map(
                    (
                      collaborator,
                      index
                    ) => (
                      <motion.div
                        key={
                          collaborator.id
                        }
                        initial={{
                          opacity: 0,
                          y: 14,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          delay:
                            index *
                            0.05,
                        }}
                      >
                        <CollaboratorResultCard
                          collaborator={
                            collaborator
                          }
                        />
                      </motion.div>
                    )
                  )}
                </div>
              </section>
            )}

            {contents.length >
              0 && (
              <section
                className={
                  styles.section
                }
              >
                <div
                  className={
                    styles.sectionTitle
                  }
                >
                  Contenido

                  <span
                    className={
                      styles.sectionCount
                    }
                  >
                    {totalContent}
                  </span>
                </div>

                <div
                  className={
                    styles.contentGrid
                  }
                >
                  {contents.map(
                    (
                      content,
                      index
                    ) => (
                      <motion.div
                        key={`${content.content_type}-${content.id}`}
                        className={
                          styles.contentCardWrapper
                        }
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
                              10
                            ) *
                            0.045,
                        }}
                      >
                        <SearchContentCard
                          content={
                            content
                          }
                        />
                      </motion.div>
                    )
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CollaboratorResultCard({
  collaborator,
}) {
  const socialEntries =
    getSocialEntries(
      collaborator
    );

  return (
    <article
      className={
        styles.collaboratorCard
      }
    >
      <Link
        to={`/colaborador/${collaborator.slug || collaborator.id}`}
        className={
          styles.collaboratorMain
        }
      >
        <div
          className={
            styles.collaboratorPhoto
          }
        >
          {collaborator.photo_url ? (
            <img
              src={
                collaborator
                  .photo_url
              }
              alt={
                collaborator.name
              }
            />
          ) : (
            <span>
              {(
                collaborator.name ||
                '?'
              )[0].toUpperCase()}
            </span>
          )}
        </div>

        <div
          className={
            styles.collaboratorText
          }
        >
          {collaborator
            .section_name && (
            <span
              className={
                styles.collaboratorSection
              }
            >
              {
                collaborator
                  .section_name
              }
            </span>
          )}

          <h2
            className={
              styles.collaboratorName
            }
          >
            {collaborator.name}
          </h2>

          {collaborator.bio && (
            <p
              className={
                styles.collaboratorBio
              }
            >
              {collaborator.bio}
            </p>
          )}

          <span
            className={
              styles.collaboratorCta
            }
          >
            Ver perfil y publicaciones →
          </span>
        </div>
      </Link>

      {socialEntries.length >
        0 && (
        <div
          className={
            styles.collaboratorSocials
          }
        >
          {socialEntries.map(
            social => (
              <a
                key={social.key}
                href={social.href}
                target={
                  social.key ===
                  'email'
                    ? undefined
                    : '_blank'
                }
                rel={
                  social.key ===
                  'email'
                    ? undefined
                    : 'noopener noreferrer'
                }
                className={
                  styles.collaboratorSocial
                }
                aria-label={
                  social.label
                }
                title={
                  social.label
                }
              >
                {social.icon}
              </a>
            )
          )}
        </div>
      )}
    </article>
  );
}

function SearchContentCard({
  content,
}) {
  const isGallery =
    content.content_type ===
    'gallery';

  const categoryName =
    isGallery
      ? 'Álbum fotográfico'
      : content
          .article_categories
          ?.[0]
          ?.categories
          ?.name ||
        content.categories
          ?.[0]
          ?.name ||
        '';

  const authorName =
    content.collaborators
      ?.name ||
    content.author_name ||
    'Agorá Revista';

  return (
    <Link
      to={
        getContentPath(
          content
        )
      }
      className={
        styles.contentCard
      }
    >
      <div
        className={
          styles.contentCardImage
        }
      >
        {content.cover_image_url ? (
          <img
            src={
              content
                .cover_image_url
            }
            alt={
              content.title
            }
          />
        ) : (
          <div
            className={
              styles.contentPlaceholder
            }
          >
            <span>Λ</span>
          </div>
        )}

        <div
          className={
            styles.contentCardOverlay
          }
        >
          <div
            className={
              styles.contentBadges
            }
          >
            {isGallery && (
              <span
                className={
                  styles.galleryBadge
                }
              >
                <Images
                  size={12}
                />

                Álbum
              </span>
            )}

            {categoryName && (
              <span
                className={
                  styles.contentCategory
                }
              >
                {categoryName}
              </span>
            )}

            {content.editions && (
              <span
                className={
                  styles.contentEdition
                }
              >
                Ed. #
                {
                  content
                    .editions
                    .number
                }
              </span>
            )}
          </div>

          <div
            className={
              styles.contentCardText
            }
          >
            <h3
              className={
                styles.contentTitle
              }
            >
              {content.title}
            </h3>

            <p
              className={
                styles.contentAuthor
              }
            >
              {authorName}
            </p>

            <div
              className={
                styles.contentMeta
              }
            >
              {content.published_at && (
                <span>
                  {formatDate(
                    content
                      .published_at
                  )}
                </span>
              )}

              {!isGallery &&
                content.reading_time && (
                <>
                  <span
                    className={
                      styles.metaDot
                    }
                  >
                    ·
                  </span>

                  <Clock
                    size={11}
                  />

                  <span>
                    {
                      content
                        .reading_time
                    }{' '}
                    min
                  </span>
                </>
              )}

              {isGallery &&
                Number(
                  content
                    .photos_count ||
                  0
                ) >
                  0 && (
                <>
                  <span
                    className={
                      styles.metaDot
                    }
                  >
                    ·
                  </span>

                  <Images
                    size={11}
                  />

                  <span>
                    {
                      content
                        .photos_count
                    }{' '}
                    fotos
                  </span>
                </>
              )}

              {Number(
                content.views ||
                0
              ) >
                0 && (
                <>
                  <span
                    className={
                      styles.metaDot
                    }
                  >
                    ·
                  </span>

                  <Eye
                    size={11}
                  />

                  <span>
                    {
                      content.views
                    }
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SearchEmpty() {
  const suggestions = [
    'Literatura',
    'Arte',
    'Cultura',
    'Poesía',
    'Cine',
    'Ensayo',
  ];

  const [
    ,
    setSearchParams,
  ] = useSearchParams();

  return (
    <div
      className={
        styles.emptyState
      }
    >
      <div
        className={
          styles.emptySymbol
        }
      >
        Λ
      </div>

      <h3>
        Explora Agorá Revista
      </h3>

      <p>
        Busca autores, artículos, álbumes o temas de tu interés.
      </p>

      <div
        className={
          styles.suggestions
        }
      >
        <div
          className={
            styles.suggestLabel
          }
        >
          Sugerencias:
        </div>

        <div
          className={
            styles.suggestTags
          }
        >
          {suggestions.map(
            suggestion => (
              <button
                key={
                  suggestion
                }
                type="button"
                className={
                  styles.suggestTag
                }
                onClick={() =>
                  setSearchParams({
                    q:
                      suggestion,
                  })
                }
              >
                {suggestion}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function NoResults({
  query,
}) {
  return (
    <div
      className={
        styles.emptyState
      }
    >
      <div
        className={
          styles.emptySymbol
        }
      >
        Ω
      </div>

      <h3>
        Sin resultados para
        {' '}
        &quot;{query}&quot;
      </h3>

      <p>
        Intenta con otro término, autor, álbum o sección.
      </p>

      <Link
        to="/"
        className={
          styles.homeLink
        }
      >
        Volver al inicio →
      </Link>
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div
      className={
        styles.skeleton
      }
    >
      {[1, 2, 3, 4, 5]
        .map(item => (
          <div
            key={item}
            className={
              styles.skeletonCard
            }
          />
        ))}
    </div>
  );
}
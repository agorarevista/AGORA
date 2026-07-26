import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCollaborator as getCollaboratorBySlug } from '../../api/collaborators.api';

import {
  getByCollaborator as getArticlesByCollaborator,
} from '../../api/articles.api';

import {
  getGalleriesByCollaborator,
} from '../../api/galleries.api';

import {
  ArrowLeft,
  Globe,
  Mail,
  Search,
  X,
} from 'lucide-react';

import {
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaTiktok
} from 'react-icons/fa6';

import styles from './CollaboratorPage.module.css';

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

function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function getSocialEntries(collab) {
  const social = collab?.social_links || {};

  return [
    {
      key: 'instagram',
      href: social.instagram || social.instagram_url || null,
      icon: <FaInstagram size={18} />
    },
    {
      key: 'facebook',
      href: social.facebook || social.facebook_url || null,
      icon: <FaFacebookF size={17} />
    },
    {
      key: 'x',
      href: social.x || social.twitter || social.twitter_url || null,
      icon: <XIcon width={18} height={18} />
    },
    {
      key: 'tiktok',
      href: social.tiktok || social.tiktok_url || null,
      icon: <FaTiktok size={17} />
    },
    {
      key: 'youtube',
      href: social.youtube || social.youtube_url || null,
      icon: <FaYoutube size={18} />
    },
    {
      key: 'website',
      href: social.website || social.portfolio || social.portfolio_url || null,
      icon: <Globe size={18} />
    },
    {
      key: 'email',
      href: collab?.email ? `mailto:${collab.email}` : null,
      icon: <Mail size={18} />
    }
  ].filter((item) => !!item.href);
}

export default function CollaboratorPage() {
  const { slug } = useParams();
  const [collab, setCollab]     = useState(null);
  const [
    contents,
    setContents,
  ] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEdition, setSelectedEdition] =
    useState('all');

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError(false);

    getCollaboratorBySlug(slug)
      .then(async (c) => {
        if (!mounted) return;

        setCollab(c);

        const collaboratorSlug =
          c?.slug ||
          slug;

        const [
          articlesResult,
          galleriesResult,
        ] = await Promise.allSettled([
          getArticlesByCollaborator(
            collaboratorSlug,
            {
              limit: 100,
            }
          ),

          getGalleriesByCollaborator(
            collaboratorSlug,
            {
              limit: 100,
            }
          ),
        ]);

        if (!mounted) {
          return;
        }

        const articleContents =
          articlesResult.status ===
            'fulfilled'
            ? (
                articlesResult
                  .value
                  ?.data ||
                []
              ).map(
                article => ({
                  ...article,

                  content_type:
                    'article',
                })
              )
            : [];

        const galleryContents =
          galleriesResult.status ===
            'fulfilled'
            ? (
                galleriesResult
                  .value
                  ?.data ||
                []
              ).map(
                gallery => ({
                  ...gallery,

                  content_type:
                    'gallery',
                })
              )
            : [];

        const mergedContents = [
          ...articleContents,
          ...galleryContents,
        ].sort(
          (a, b) =>
            getContentDate(b) -
            getContentDate(a)
        );

        setContents(
          mergedContents
        );
      })
      .catch(() => {
        if (mounted) setError(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  const socialEntries = useMemo(
    () => getSocialEntries(collab),
    [collab]
  );

  const editions = useMemo(() => {
    const editionMap = new Map();

    contents.forEach(content => {
      const edition =
        content.editions || null;

      if (!edition?.id) {
        return;
      }

      editionMap.set(
        edition.id,
        edition
      );
    });

    return Array
      .from(editionMap.values())
      .sort(
        (
          firstEdition,
          secondEdition
        ) =>
          Number(
            secondEdition.number || 0
          ) -
          Number(
            firstEdition.number || 0
          )
      );
  }, [contents]);

  const filteredContents = useMemo(() => {
    const normalizedSearch =
      searchTerm
        .trim()
        .toLocaleLowerCase('es');

    return contents.filter(content => {
      const title =
        String(content.title || '')
          .toLocaleLowerCase('es');

      const subtitle =
        String(content.subtitle || '')
          .toLocaleLowerCase('es');

      const excerpt =
        String(content.excerpt || '')
          .toLocaleLowerCase('es');

      const matchesSearch =
        !normalizedSearch ||
        title.includes(normalizedSearch) ||
        subtitle.includes(normalizedSearch) ||
        excerpt.includes(normalizedSearch);

      const editionId =
        content.editions?.id ||
        content.edition_id ||
        'without-edition';

      const matchesEdition =
        selectedEdition === 'all' ||
        selectedEdition === editionId;

      return (
        matchesSearch &&
        matchesEdition
      );
    });
  }, [
    contents,
    searchTerm,
    selectedEdition,
  ]);

  const groupedContents = useMemo(() => {
    const groupMap = new Map();

    filteredContents.forEach(content => {
      const edition =
        content.editions || null;

      const groupId =
        edition?.id ||
        'without-edition';

      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, {
          id: groupId,

          edition,

          contents: [],
        });
      }

      groupMap
        .get(groupId)
        .contents
        .push(content);
    });

    return Array
      .from(groupMap.values())
      .map(group => ({
        ...group,

        contents: [
          ...group.contents,
        ].sort(
          (firstContent, secondContent) =>
            getContentDate(secondContent) -
            getContentDate(firstContent)
        ),
      }))
      .sort((firstGroup, secondGroup) => {
        if (
          firstGroup.id ===
          'without-edition'
        ) {
          return 1;
        }

        if (
          secondGroup.id ===
          'without-edition'
        ) {
          return -1;
        }

        return (
          Number(
            secondGroup.edition?.number || 0
          ) -
          Number(
            firstGroup.edition?.number || 0
          )
        );
      });
  }, [filteredContents]);

  const clearContentFilters = () => {
    setSearchTerm('');
    setSelectedEdition('all');
  };

  const hasActiveContentFilters =
    searchTerm.trim() !== '' ||
    selectedEdition !== 'all';

  if (loading) return <CollabSkeleton />;
  if (error || !collab) return <NotFound />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.back}>
            <ArrowLeft size={13} /> Inicio
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.profile}
          >
<div className={styles.profileMain}>
  <div className={styles.avatarWrap}>
    {collab.photo_url ? (
      <img
        src={collab.photo_url}
        alt={collab.name}
        className={styles.avatar}
      />
    ) : (
      <div className={styles.avatarPlaceholder}>
        {collab.name?.[0]?.toUpperCase()}
      </div>
    )}
  </div>

  <div className={styles.profileInfo}>
    <span className={styles.profileEyebrow}>
      {collab.type === 'fixed'
        ? 'Colaborador fijo'
        : 'Colaborador'}
    </span>

    <h1 className={styles.profileName}>
      {collab.name}
    </h1>

    {collab.bio && (
      <p className={styles.profileBio}>
        {collab.bio}
      </p>
    )}

    {collab.section_name && (
      <Link
        to={`/categoria/${
          collab.section_slug ||
          collab.section_name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
        }`}
        className={styles.profileColumnLink}
      >
        <span className={styles.profileColumnLabel}>
          Columna
        </span>

        <strong className={styles.profileColumnName}>
          {collab.section_name}
        </strong>
      </Link>
    )}
  </div>

  <aside className={styles.profileSide}>
    <div className={styles.articleCount}>
      <span className={styles.articleCountNum}>
        {contents.length}
      </span>

      <span className={styles.articleCountLabel}>
        {contents.length === 1
          ? 'publicación'
          : 'publicaciones'}
      </span>
    </div>

    {socialEntries.length > 0 && (
      <div className={styles.socials}>
        {socialEntries.map(item => (
          <a
            key={item.key}
            href={item.href}
            target={
              item.key === 'email'
                ? undefined
                : '_blank'
            }
            rel={
              item.key === 'email'
                ? undefined
                : 'noopener noreferrer'
            }
            className={styles.socialIconLink}
            aria-label={item.key}
            title={item.key}
          >
            {item.icon}
          </a>
        ))}
      </div>
    )}
  </aside>
</div>
          </motion.div>
        </div>
      </div>

      <div className={styles.meander} />

      <div className={styles.body}>
        <div className={styles.bodyHeader}>
          <h2 className={styles.bodyTitle}>
            Publicaciones de {collab.name}

            <span className={styles.bodyCount}>
              {contents.length}
            </span>
          </h2>
        </div>

        {contents.length > 0 && (
          <div className={styles.publicationFilters}>
            <div className={styles.publicationSearch}>
              <Search
                size={18}
                className={styles.publicationSearchIcon}
              />

              <input
                type="search"
                value={searchTerm}
                onChange={event =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Buscar publicaciones..."
                aria-label="Buscar publicaciones"
                className={styles.publicationSearchInput}
              />

              {searchTerm && (
                <button
                  type="button"
                  className={styles.publicationClearSearch}
                  onClick={() =>
                    setSearchTerm('')
                  }
                  aria-label="Limpiar búsqueda"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className={styles.publicationSelectControl}>
              <label htmlFor="collaborator-edition-filter">
                Edición
              </label>

              <select
                id="collaborator-edition-filter"
                value={selectedEdition}
                onChange={event =>
                  setSelectedEdition(
                    event.target.value
                  )
                }
                className={styles.publicationSelect}
              >
                <option value="all">
                  Todas las ediciones
                </option>

                {editions.map(edition => (
                  <option
                    key={edition.id}
                    value={edition.id}
                  >
                    Edición {edition.number}
                    {edition.name
                      ? ` — ${edition.name}`
                      : ''}
                  </option>
                ))}

                {contents.some(
                  content =>
                    !content.editions?.id &&
                    !content.edition_id
                ) && (
                  <option value="without-edition">
                    Sin edición
                  </option>
                )}
              </select>
            </div>

            <span className={styles.filteredResults}>
              {filteredContents.length}{' '}
              {filteredContents.length === 1
                ? 'publicación'
                : 'publicaciones'}
            </span>

            {hasActiveContentFilters && (
              <button
                type="button"
                className={styles.publicationClearFilters}
                onClick={clearContentFilters}
              >
                <X size={15} />
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {contents.length === 0 ? (
          <div className={styles.emptyResults}>
            <span
              className={styles.emptyResultsSymbol}
              aria-hidden="true"
            >
              Λ
            </span>

            <h2 className={styles.emptyResultsTitle}>
              Aún no hay publicaciones
            </h2>

            <p className={styles.emptyResultsText}>
              Las publicaciones de este colaborador
              aparecerán aquí próximamente.
            </p>
          </div>
        ) : groupedContents.length === 0 ? (
          <div className={styles.emptyResults}>
            <span
              className={styles.emptyResultsSymbol}
              aria-hidden="true"
            >
              Λ
            </span>

            <h2 className={styles.emptyResultsTitle}>
              No encontramos publicaciones
            </h2>

            <p className={styles.emptyResultsText}>
              No encontramos publicaciones con
              esos filtros.
            </p>

            <button
              type="button"
              className={styles.emptyResultsButton}
              onClick={clearContentFilters}
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className={styles.editionsList}>
            {groupedContents.map(group => (
              <section
                key={group.id}
                className={styles.editionGroup}
              >
                <header className={styles.editionHeader}>
                  <div>
                    <span className={styles.editionEyebrow}>
                      Archivo editorial
                    </span>

                    <h3 className={styles.editionTitle}>
                      {group.edition
                        ? `Edición ${group.edition.number}`
                        : 'Sin edición'}
                    </h3>

                    {group.edition?.name && (
                      <p className={styles.editionName}>
                        {group.edition.name}
                      </p>
                    )}
                  </div>

                  <span className={styles.editionCount}>
                    {group.contents.length}{' '}
                    {group.contents.length === 1
                      ? 'publicación'
                      : 'publicaciones'}
                  </span>
                </header>

                <div className={styles.editionDivider} />

                <div className={styles.grid}>
                  {group.contents.map(
                    (
                      content,
                      index
                    ) => (
                      <motion.div
                        key={`${content.content_type}-${content.id}`}
                        className={styles.cardWrapper}
                        initial={{
                          opacity: 0,
                          y: 16,
                        }}
                        whileInView={{
                          opacity: 1,
                          y: 0,
                        }}
                        viewport={{
                          once: true,
                          amount: 0.12,
                        }}
                        transition={{
                          delay:
                            Math.min(
                              index % 5,
                              4
                            ) * 0.06,
                        }}
                      >
                        <CollaboratorContentCard
                          content={content}
                          authorName={collab.name}
                        />
                      </motion.div>
                    )
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatArticleDate(dateValue) {
  if (!dateValue) {
    return '';
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function isRecentArticle(dateValue) {
  if (!dateValue) {
    return false;
  }

  const publishedDate = new Date(dateValue);

  if (Number.isNaN(publishedDate.getTime())) {
    return false;
  }

  const now = new Date();

  const elapsedMilliseconds =
    now.getTime() - publishedDate.getTime();

  const elapsedDays =
    elapsedMilliseconds /
    (1000 * 60 * 60 * 24);

  return (
    elapsedDays >= 0 &&
    elapsedDays <= 10
  );
}

function CollaboratorContentCard({
  content,
  authorName,
}) {
  const publishedDate =
    formatArticleDate(
      content.published_at
    );

  const isNew =
    isRecentArticle(
      content.published_at
    );

  const isGallery =
    content.content_type ===
    'gallery';

  return (
    <Link
      to={
        getContentPath(
          content
        )
      }
      className={
        styles.card
      }
    >
      <div
        className={
          styles.cardImg
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
              styles.cardImgPlaceholder
            }
          >
            <span>Λ</span>
          </div>
        )}

        {isNew && (
          <span
            className={
              styles.newBadge
            }
          >
            <span
              className={
                styles.newBadgeText
              }
            >
              Nuevo
            </span>

            <span
              className={
                styles.newBadgeSymbol
              }
              aria-hidden="true"
            />
          </span>
        )}

        <div
          className={
            styles.cardOverlay
          }
        >
          <div
            className={
              styles.cardText
            }
          >
            {isGallery && (
              <span
                className={
                  styles.contentTypeBadge
                }
              >
                Álbum fotográfico
              </span>
            )}

            <h3
              className={
                styles.cardTitle
              }
            >
              {content.title}
            </h3>

            <p
              className={
                styles.cardAuthor
              }
            >
              {authorName}
            </p>

            {publishedDate && (
              <time
                className={
                  styles.cardDate
                }
                dateTime={
                  content
                    .published_at
                }
              >
                {publishedDate}
              </time>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
function CollabSkeleton() {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 1480,
        margin: '0 auto',
        padding: '48px 24px',
      }}
    >
      <div
        style={{
          height: 240,
          marginBottom: 32,
          borderRadius: 4,
          background: 'var(--color-gray-200)',
        }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(5, minmax(0, 1fr))',
          gap: 22,
        }}
      >
        {[1, 2, 3, 4, 5].map(item => (
          <div
            key={item}
            style={{
              aspectRatio: '4 / 5.35',
              borderRadius: 2,
              background:
                'var(--color-gray-200)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '96px 24px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, color: 'var(--color-gray-300)' }}>Λ</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 16 }}>
        Colaborador no encontrado
      </h2>
      <Link to="/" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-sans)' }}>
        Volver al inicio
      </Link>
    </div>
  );
}
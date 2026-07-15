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

import { ArrowLeft, Globe, Mail } from 'lucide-react';

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
      ? `/galerias/${content.slug}`
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
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

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
              limit: 50,
            }
          ),

          getGalleriesByCollaborator(
            collaboratorSlug,
            {
              limit: 50,
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

  const socialEntries = useMemo(() => getSocialEntries(collab), [collab]);

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
                {collab.photo_url
                  ? <img src={collab.photo_url} alt={collab.name} className={styles.avatar} />
                  : <div className={styles.avatarPlaceholder}>{collab.name?.[0]?.toUpperCase()}</div>
                }
              </div>

              <div className={styles.profileInfo}>
                {collab.section_name && (
                  <div className={styles.profileSection}>{collab.section_name}</div>
                )}

                <h1 className={styles.profileName}>{collab.name}</h1>

                {collab.bio && (
                  <p className={styles.profileBio}>{collab.bio}</p>
                )}
              </div>

              <aside className={styles.profileSide}>
                <div className={styles.articleCount}>
                  <span
                    className={
                      styles.articleCountNum
                    }
                  >
                    {contents.length}
                  </span>

                  <span
                    className={
                      styles.articleCountLabel
                    }
                  >
                    publicación
                    {contents.length !==
                    1
                      ? 'es'
                      : ''}
                  </span>
                </div>

                {socialEntries.length > 0 && (
                  <div className={styles.socials}>
                    {socialEntries.map((item) => (
                      <a
                        key={item.key}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
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
      <div
        className={
          styles.body
        }
      >
        <div
          className={
            styles.bodyHeader
          }
        >
          <h2
            className={
              styles.bodyTitle
            }
          >
            Publicaciones de{' '}
            {collab.name}

            <span
              className={
                styles.bodyCount
              }
            >
              {contents.length}
            </span>
          </h2>

          {contents.length > 0 && (
            <Link
              to="/buscar"
              className={
                styles.bodyMore
              }
            >
              Ver todos →
            </Link>
          )}
        </div>

        {contents.length === 0 ? (
          <div
            className={
              styles.empty
            }
          >
            <span>Λ</span>

            <p>
              Aún no hay publicaciones.
            </p>
          </div>
        ) : (
          <div
            className={
              styles.grid
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
                    styles.cardWrapper
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
                        index % 5,
                        4
                      ) *
                      0.06,
                  }}
                >
                  <CollaboratorContentCard
                    content={
                      content
                    }
                    authorName={
                      collab.name
                    }
                  />
                </motion.div>
              )
            )}
          </div>
        )}
      </div>
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
              New
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
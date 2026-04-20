import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCollaborator as getCollaboratorBySlug } from '../../api/collaborators.api';
import { getByCollaborator as getArticlesByCollaborator } from '../../api/articles.api';
import { formatDate } from '../../utils/formatDate';
import { Clock, Eye, ArrowLeft, Globe, Mail } from 'lucide-react';
import {
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaTiktok
} from 'react-icons/fa6';
import styles from './CollaboratorPage.module.css';

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
  const [articles, setArticles] = useState([]);
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

        const collaboratorSlug = c?.slug || slug;
        const arts = await getArticlesByCollaborator(collaboratorSlug, { limit: 20 });

        if (!mounted) return;
        setArticles(arts.data || []);
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
                <div className={styles.profileLabel}>
                  {collab.type === 'fixed' ? 'Colaborador fijo' : 'Colaborador'}
                </div>

                <h1 className={styles.profileName}>{collab.name}</h1>

                {collab.section_name && (
                  <div className={styles.profileSection}>{collab.section_name}</div>
                )}

                {collab.bio && (
                  <p className={styles.profileBio}>{collab.bio}</p>
                )}
                {null}
              </div>
            </div>

            <aside className={styles.profileAside}>
              <div className={styles.asideBlock}>
                <div className={styles.asideTitle}>Sobre {collab.name?.split(' ')?.[0] || 'este colaborador'}</div>

                <div className={styles.infoList}>
                  {collab.section_name && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoIcon}>✦</span>
                      <span>{collab.section_name}</span>
                    </div>
                  )}

                  {collab.email && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoIcon}>✉</span>
                      <span>{collab.email}</span>
                    </div>
                  )}

                  {collab.phone && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoIcon}>☏</span>
                      <span>{collab.phone}</span>
                    </div>
                  )}

                  <div className={styles.infoRow}>
                    <span className={styles.infoIcon}>◍</span>
                    <span>{articles.length} artículo{articles.length !== 1 ? 's' : ''} publicado{articles.length !== 1 ? 's' : ''}</span>
                  </div>

                  {collab.type && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoIcon}>•</span>
                      <span>{collab.type === 'fixed' ? 'Colaborador fijo' : 'Colaborador ocasional'}</span>
                    </div>
                  )}
                </div>
              </div>

              {socialEntries.length > 0 && (
                <div className={styles.asideBlock}>
                  <div className={styles.asideTitle}>Redes sociales</div>

                  <div className={styles.socialsAside}>
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
                </div>
              )}
            </aside>
          </motion.div>
        </div>
      </div>

      <div className={styles.meander} />

      <div className={styles.body}>
        <div className={styles.bodyHeader}>
          <h2 className={styles.bodyTitle}>
            Artículos de {collab.name}
            <span className={styles.bodyCount}>{articles.length}</span>
          </h2>

          {articles.length > 0 && (
            <Link to="/buscar" className={styles.bodyMore}>
              Ver todos →
            </Link>
          )}
        </div>

        {articles.length === 0 ? (
          <div className={styles.empty}>
            <span>Λ</span>
            <p>Aún no hay artículos publicados.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {articles.map((art, i) => (
              <motion.div
                key={art.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 5) * 0.06 }}
              >
                <Link to={`/articulos/${art.slug}`} className={styles.card}>
                  {art.cover_image_url && (
                    <div className={styles.cardImg}>
                      <img src={art.cover_image_url} alt={art.title} />
                    </div>
                  )}

                  <div className={styles.cardBody}>
                    {art.article_categories?.[0]?.categories && (
                      <span className={styles.cat}>
                        {art.article_categories[0].categories.name}
                      </span>
                    )}

                    <h3 className={styles.cardTitle}>{art.title}</h3>

                    <div className={styles.cardAuthor}>
                      {collab.name}
                    </div>

                    <div className={styles.cardMeta}>
                      <span>{formatDate(art.published_at)}</span>
                      {art.reading_time && (
                        <>
                          <span className={styles.dot}>·</span>
                          <Clock size={11} />
                          <span>{art.reading_time}′</span>
                        </>
                      )}
                      {art.views > 0 && (
                        <>
                          <span className={styles.dot}>·</span>
                          <Eye size={11} />
                          <span>{art.views}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CollabSkeleton() {
  return (
    <div style={{ padding: '48px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ height: 240, background: 'var(--color-gray-200)', borderRadius: 8, marginBottom: 32 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 280, background: 'var(--color-gray-200)', borderRadius: 8 }} />
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
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCollaborator as getCollaboratorBySlug } from '../../api/collaborators.api';
import { getByCollaborator as getArticlesByCollaborator } from '../../api/articles.api';
import { formatDate } from '../../utils/formatDate';
import { Clock, Eye, ArrowLeft } from 'lucide-react';
import styles from './CollaboratorPage.module.css';

export default function CollaboratorPage() {
  const { slug } = useParams();
  const [collab, setCollab]     = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);

    getCollaboratorBySlug(slug)
      .then(async (c) => {
        setCollab(c);

        const collaboratorSlug = c?.slug || slug;
        const arts = await getArticlesByCollaborator(collaboratorSlug, { limit: 20 });

        setArticles(arts.data || []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <CollabSkeleton />;
  if (error || !collab) return <NotFound />;

  const socials = collab.social_links || {};

  return (
    <div className={styles.page}>

      {/* ── Header del colaborador ─────────────────────────── */}
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

              {/* Redes sociales */}
              {Object.keys(socials).length > 0 && (
                <div className={styles.socials}>
                  {Object.entries(socials).map(([net, url]) =>
                    url ? (
                      <a
                        key={net}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.socialLink}
                      >
                        {net.charAt(0).toUpperCase() + net.slice(1)}
                      </a>
                    ) : null
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className={styles.meander} />

      {/* ── Artículos del colaborador ──────────────────────── */}
      <div className={styles.body}>
        <div className={styles.bodyHeader}>
          <h2 className={styles.bodyTitle}>
            Artículos de {collab.name}
            <span className={styles.bodyCount}>{articles.length}</span>
          </h2>
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
                    {art.excerpt && <p className={styles.cardExcerpt}>{art.excerpt}</p>}
                    <div className={styles.cardMeta}>
                      <span>{formatDate(art.published_at)}</span>
                      {art.reading_time && (
                        <><span className={styles.dot}>·</span><Clock size={11}/><span>{art.reading_time} min</span></>
                      )}
                      {art.views > 0 && (
                        <><span className={styles.dot}>·</span><Eye size={11}/><span>{art.views}</span></>
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
    <div style={{ padding: '48px 24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ height: 200, background: 'var(--color-gray-200)', borderRadius: 8, marginBottom: 32 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
        {[1,2,3].map(i => <div key={i} style={{ height: 280, background: 'var(--color-gray-200)', borderRadius: 4 }} />)}
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
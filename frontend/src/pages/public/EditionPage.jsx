import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getEdition as getEditionByNumber } from '../../api/editions.api';
import { getByEdition as getArticlesByEdition } from '../../api/articles.api';
import { formatDate } from '../../utils/formatDate';
import { Clock, Eye, BookOpen, ArrowLeft } from 'lucide-react';
import styles from './EditionPage.module.css';

export default function EditionPage() {
  const { number } = useParams();
  const [edition, setEdition]   = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  useEffect(() => {
    setLoading(true);
    getEditionByNumber(number)
      .then(async (ed) => {
        setEdition(ed);
        const arts = await getArticlesByEdition(ed.id, { limit: 30 });
        setArticles(arts.data || []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [number]);

  if (loading) return <EditionSkeleton />;
  if (error || !edition) return <NotFound />;

  const featured    = articles.filter(a => a.is_featured);
  const regularArts = articles.filter(a => !a.is_featured);

  return (
    <div className={styles.page}>

      {/* ── Hero de la edición ─────────────────────────────── */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <Link to="/" className={styles.back}>
            <ArrowLeft size={13} /> Inicio
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.heroLayout}
          >
            {/* Portada */}
            <div className={styles.coverWrap}>
              {edition.cover_image_url
                ? <img src={edition.cover_image_url} alt={edition.name} className={styles.cover} />
                : (
                  <div className={styles.coverPlaceholder}>
                    <BookOpen size={48} />
                    <span>Edición #{edition.number}</span>
                  </div>
                )
              }
            </div>

            {/* Info */}
            <div className={styles.heroInfo}>
              <div className={styles.heroKicker}>
                <span className={styles.editionBadge}>Edición #{edition.number}</span>
                {edition.is_current && (
                  <span className={styles.currentBadge}>Edición actual</span>
                )}
              </div>
              <h1 className={styles.heroTitle}>{edition.name}</h1>
              {edition.description && (
                <p className={styles.heroDesc}>{edition.description}</p>
              )}
              {edition.published_at && (
                <div className={styles.heroDate}>
                  Publicada: {formatDate(edition.published_at)}
                </div>
              )}
              <div className={styles.heroStats}>
                <div className={styles.heroStat}>
                  <span className={styles.heroStatNum}>{articles.length}</span>
                  <span className={styles.heroStatLabel}>artículos</span>
                </div>
                {featured.length > 0 && (
                  <div className={styles.heroStat}>
                    <span className={styles.heroStatNum}>{featured.length}</span>
                    <span className={styles.heroStatLabel}>destacados</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className={styles.meander} />

      {/* ── Artículos ─────────────────────────────────────── */}
      <div className={styles.body}>

        {/* Destacados */}
        {featured.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Artículos destacados</h2>
            <div className={styles.featuredGrid}>
              {featured.map((art, i) => (
                <motion.div
                  key={art.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <FeaturedCard article={art} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Todos los artículos */}
        {regularArts.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {featured.length > 0 ? 'Todos los artículos' : 'Artículos de esta edición'}
            </h2>
            <div className={styles.grid}>
              {regularArts.map((art, i) => (
                <motion.div
                  key={art.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 6) * 0.05 }}
                >
                  <ArticleRow article={art} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {articles.length === 0 && (
          <div className={styles.empty}>
            <BookOpen size={36} />
            <p>Esta edición no tiene artículos publicados todavía.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FeaturedCard({ article: art }) {
  return (
    <Link to={`/articulos/${art.slug}`} className={styles.featuredCard}>
      <div className={styles.featuredCardImg}>
        {art.cover_image_url
          ? <img src={art.cover_image_url} alt={art.title} />
          : <div className={styles.imgPlaceholder}><span>Λ</span></div>
        }
      </div>
      <div className={styles.featuredCardBody}>
        {art.article_categories?.[0]?.categories && (
          <span className={styles.cat}>{art.article_categories[0].categories.name}</span>
        )}
        <h3 className={styles.featuredCardTitle}>{art.title}</h3>
        {art.excerpt && <p className={styles.featuredCardExcerpt}>{art.excerpt}</p>}
        <div className={styles.cardMeta}>
          {art.collaborators && <span className={styles.cardAuthor}>{art.collaborators.name}</span>}
          <span className={styles.dot}>·</span>
          <span>{formatDate(art.published_at)}</span>
          {art.reading_time && <><span className={styles.dot}>·</span><Clock size={11}/><span>{art.reading_time} min</span></>}
          {art.views > 0 && <><span className={styles.dot}>·</span><Eye size={11}/><span>{art.views}</span></>}
        </div>
      </div>
    </Link>
  );
}

function ArticleRow({ article: art }) {
  return (
    <Link to={`/articulos/${art.slug}`} className={styles.articleRow}>
      {art.cover_image_url && (
        <div className={styles.rowImg}>
          <img src={art.cover_image_url} alt={art.title} />
        </div>
      )}
      <div className={styles.rowBody}>
        {art.article_categories?.[0]?.categories && (
          <span className={styles.cat}>{art.article_categories[0].categories.name}</span>
        )}
        <h3 className={styles.rowTitle}>{art.title}</h3>
        {art.excerpt && <p className={styles.rowExcerpt}>{art.excerpt}</p>}
        <div className={styles.cardMeta}>
          {art.collaborators && <span className={styles.cardAuthor}>{art.collaborators.name}</span>}
          <span className={styles.dot}>·</span>
          <span>{formatDate(art.published_at)}</span>
          {art.reading_time && <><span className={styles.dot}>·</span><Clock size={11}/><span>{art.reading_time} min</span></>}
        </div>
      </div>
    </Link>
  );
}

function EditionSkeleton() {
  return (
    <div style={{ padding: '48px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ height: 300, background: 'var(--color-gray-200)', borderRadius: 4, marginBottom: 32 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
        {[1,2,3].map(i => <div key={i} style={{ height: 240, background: 'var(--color-gray-200)', borderRadius: 4 }} />)}
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '96px 24px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, color: 'var(--color-gray-300)' }}>Λ</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 16 }}>
        Edición no encontrada
      </h2>
      <Link to="/" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-sans)' }}>
        Volver al inicio
      </Link>
    </div>
  );
}
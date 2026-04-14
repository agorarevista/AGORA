import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getArticle } from '../../api/articles.api';
import { formatDate } from '../../utils/formatDate';
import { Clock, Eye, ArrowLeft } from 'lucide-react';
import LikeButton from '../../components/common/LikeButton/LikeButton';
import ShareButtons from '../../components/common/ShareButtons/ShareButtons';
import Comments from '../../components/common/Comments/Comments';
import styles from './ArticlePage.module.css';

export default function ArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getArticle(slug)
      .then(setArticle)
      .catch(() => setError('Artículo no encontrado'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <ArticleSkeleton />;
  if (error)   return <NotFound />;

  const collab = article.collaborators;
  const cats   = article.article_categories?.map(ac => ac.categories).filter(Boolean) || [];
  const tags   = article.article_tags || [];

  return (
    <div className={styles.page}>

      {/* ── Cabecera ──────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={styles.header}
      >
        <div className={styles.headerInner}>

          {/* Volver */}
          <Link to="/" className={styles.back}>
            <ArrowLeft size={14} /> Inicio
          </Link>

          {/* Categorías */}
          {cats.length > 0 && (
            <div className={styles.categories}>
              {cats.map(cat => (
                <Link key={cat.id} to={`/categoria/${cat.slug}`} className={styles.categoryTag}>
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          {/* Título */}
          <h1 className={styles.title}>{article.title}</h1>

          {/* Subtítulo */}
          {article.subtitle && (
            <p className={styles.subtitle}>{article.subtitle}</p>
          )}

          {/* Meta */}
          <div className={styles.meta}>
            {collab && (
              <Link to={`/colaborador/${collab.slug}`} className={styles.author}>
                {collab.photo_url && (
                  <img src={collab.photo_url} alt={collab.name} className={styles.authorAvatar} />
                )}
                <span>{collab.name}</span>
                {collab.section_name && (
                  <span className={styles.authorSection}>· {collab.section_name}</span>
                )}
              </Link>
            )}
            <div className={styles.metaRight}>
              <span>{formatDate(article.published_at)}</span>
              {article.reading_time && (
                <>
                  <span className={styles.dot}>·</span>
                  <Clock size={12} />
                  <span>{article.reading_time} min de lectura</span>
                </>
              )}
              {article.views > 0 && (
                <>
                  <span className={styles.dot}>·</span>
                  <Eye size={12} />
                  <span>{article.views} lecturas</span>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* ── Meandro ───────────────────────────────────────── */}
      <div className={styles.meander} />

      {/* ── Imagen portada ────────────────────────────────── */}
      {article.cover_image_url && (
        <motion.div
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={styles.coverWrap}
        >
          <img
            src={article.cover_image_url}
            alt={article.title}
            className={styles.cover}
          />
        </motion.div>
      )}

      {/* ── Contenido ─────────────────────────────────────── */}
      <div className={styles.layout}>
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={styles.content}
        >
          {/* HTML del artículo */}
          {article.content_html && (
            <div
              className={styles.body}
              dangerouslySetInnerHTML={{ __html: article.content_html }}
            />
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className={styles.tags}>
              {tags.map(t => (
                <span key={t.id} className={styles.tag}>
                  {t.tag_type && <span className={styles.tagType}>{t.tag_type}</span>}
                  {t.tag}
                </span>
              ))}
            </div>
          )}

          {/* Meandro antes de acciones */}
          <div className={styles.meander} style={{ margin: '32px 0' }} />

          {/* Likes y compartir */}
          <div className={styles.actions}>
            <LikeButton articleId={article.id} />
            <ShareButtons article={article} />
          </div>

          {/* Autor info */}
          {collab && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className={styles.authorCard}
            >
              {collab.photo_url && (
                <img src={collab.photo_url} alt={collab.name} className={styles.authorCardAvatar} />
              )}
              <div className={styles.authorCardInfo}>
                <div className={styles.authorCardLabel}>Sobre el autor</div>
                <Link to={`/colaborador/${collab.slug}`} className={styles.authorCardName}>
                  {collab.name}
                </Link>
                {collab.section_name && (
                  <div className={styles.authorCardSection}>{collab.section_name}</div>
                )}
                {collab.bio && (
                  <p className={styles.authorCardBio}>{collab.bio}</p>
                )}
                {collab.social_links && (
                  <div className={styles.authorSocials}>
                    {Object.entries(collab.social_links).map(([net, url]) =>
                      url ? (
                        <a key={net} href={url} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                          {net}
                        </a>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Comentarios */}
          <Comments articleId={article.id} />
        </motion.article>

        {/* ── Sidebar ─────────────────────────────────────── */}
        <aside className={styles.sidebar}>
          {/* Edición */}
          {article.editions && (
            <div className={styles.sideWidget}>
              <div className={styles.widgetLabel}>Edición</div>
              <Link
                to={`/edicion/${article.editions.number}`}
                className={styles.widgetEdition}
              >
                № {article.editions.number} — {article.editions.name}
              </Link>
            </div>
          )}

          {/* Categorías */}
          {cats.length > 0 && (
            <div className={styles.sideWidget}>
              <div className={styles.widgetLabel}>Secciones</div>
              <div className={styles.widgetCats}>
                {cats.map(cat => (
                  <Link key={cat.id} to={`/categoria/${cat.slug}`} className={styles.widgetCat}>
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Substack si existe */}
          {article.substack_url && (
            <div className={styles.sideWidget}>
              <a
                href={article.substack_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.substackLink}
              >
                Leer también en Substack →
              </a>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function ArticleSkeleton() {
  return (
    <div style={{ padding: '48px 24px', maxWidth: 760, margin: '0 auto' }}>
      {[200, 400, 60, 300, 300, 200].map((w, i) => (
        <div key={i} style={{
          height: i === 1 ? 48 : 20,
          width: `${w}px`,
          maxWidth: '100%',
          background: 'var(--color-gray-200)',
          borderRadius: 4,
          marginBottom: 16,
          animation: 'shimmer 1.5s infinite'
        }} />
      ))}
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '96px 24px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 64, color: 'var(--color-gray-300)' }}>Λ</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 16 }}>
        Artículo no encontrado
      </h2>
      <Link to="/" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-sans)' }}>
        Volver al inicio
      </Link>
    </div>
  );
}
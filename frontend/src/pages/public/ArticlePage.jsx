import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getArticle } from '../../api/articles.api';
import { getComments } from '../../api/comments.api';
import { formatDate } from '../../utils/formatDate';
import {
  Clock,
  Eye,
  ArrowLeft,
  MessageCircle,
  Maximize2
} from 'lucide-react';
import {
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaTiktok,
  FaGlobe,
  FaLink
} from 'react-icons/fa6';
import LikeButton from '../../components/common/LikeButton/LikeButton';
import ShareButtons from '../../components/common/ShareButtons/ShareButtons';
import Comments from '../../components/common/Comments/Comments';
import ImageViewer from '../../components/common/ImageViewer/ImageViewer';
import styles from './ArticlePage.module.css';

export default function ArticlePage() {
  const { slug } = useParams();
  const [article, setArticle]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [viewer, setViewer]             = useState(null); // { src, alt }
  const bodyRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    getArticle(slug)
      .then(setArticle)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const loadCommentCount = useCallback(async () => {
    if (!article?.id) return;

    try {
      const data = await getComments(article.id);

      const totalCount = (data || []).reduce((acc, item) => {
        return acc + 1 + (item.replies?.length || 0);
      }, 0);

      setCommentCount(totalCount);
    } catch {
    }
  }, [article?.id]);

  useEffect(() => {
    if (!article?.id) return;

    loadCommentCount();

    const interval = setInterval(() => {
      loadCommentCount();
    }, 2500);

    return () => clearInterval(interval);
  }, [article?.id, loadCommentCount]);

  // Hacer imágenes del cuerpo clickeables para fullscreen
  useEffect(() => {
    if (!bodyRef.current || !article) return;
    const imgs = bodyRef.current.querySelectorAll('img');
    imgs.forEach(img => {
      // Crear wrapper
      if (img.parentElement?.classList?.contains('img-wrapper')) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'img-wrapper';
      wrapper.style.cssText = 'position:relative;display:block;cursor:zoom-in;';
      img.parentNode.insertBefore(wrapper, img);
      wrapper.appendChild(img);

      // Ícono expand
      const icon = document.createElement('div');
      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`;
      icon.style.cssText = `
        position:absolute;top:12px;right:12px;
        background:rgba(0,0,0,0.55);
        border-radius:8px;padding:6px;
        display:flex;align-items:center;justify-content:center;
        opacity:0;transition:opacity 0.2s;pointer-events:none;
      `;
      wrapper.appendChild(icon);

      wrapper.addEventListener('mouseenter', () => { icon.style.opacity = '1'; });
      wrapper.addEventListener('mouseleave', () => { icon.style.opacity = '0'; });
      wrapper.addEventListener('click', () => {
        setViewer({ src: img.src, alt: img.alt || '' });
      });
    });
  }, [article]);

  if (loading) return <ArticleSkeleton />;
  if (error)   return <NotFound />;

  const collab = article.collaborators;
  const cats   = article.article_categories?.map(ac => ac.categories).filter(Boolean) || [];
  const tags   = article.article_tags || [];

  const renderSocialIcon = (net) => {
    const key = String(net || '').toLowerCase();

    if (key === 'instagram') return <FaInstagram size={26} />;
    if (key === 'facebook') return <FaFacebookF size={24} />;
    if (key === 'youtube') return <FaYoutube size={26} />;
    if (key === 'tiktok') return <FaTiktok size={24} />;
    if (key === 'website') return <FaGlobe size={24} />;

    if (key === 'twitter' || key === 'x') {
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    }

    return <FaLink size={24} />;
  };
  const socialEntries = Object.entries(collab?.social_links || {}).filter(
    ([, url]) => Boolean(url)
  );

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
          <Link to="/" className={styles.back}>
            <ArrowLeft size={14} /> Inicio
          </Link>

          {cats.length > 0 && (
            <div className={styles.categories}>
              {cats.map((cat, index) => (
                <Link
                  key={cat.id || cat.slug || `${cat.name}-${index}`}
                  to={`/categoria/${cat.slug}`}
                  className={styles.categoryTag}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          <h1 className={styles.title}>{article.title}</h1>

          {article.subtitle && (
            <p className={styles.subtitle}>{article.subtitle}</p>
          )}

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
                  <span>{article.reading_time} min</span>
                </>
              )}
              {article.views > 0 && (
                <>
                  <span className={styles.dot}>·</span>
                  <Eye size={12} />
                  <span>{article.views}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      <div className={styles.meander} />

      {/* ── Portada clickeable ─────────────────────────────── */}
      {article.cover_image_url && (
        <motion.div
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={styles.coverWrap}
          onClick={() => setViewer({ src: article.cover_image_url, alt: article.title })}
        >
          <img src={article.cover_image_url} alt={article.title} className={styles.cover} />
          <div className={styles.coverExpand}>
            <Maximize2 size={18} />
          </div>
        </motion.div>
      )}

      {/* ── Artículo centrado ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={styles.article}
      >
        {/* Contenido */}
        {article.content_html && (
          <div
            ref={bodyRef}
            className={styles.body}
            dangerouslySetInnerHTML={{ __html: article.content_html }}
          />
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className={styles.tags}>
            {tags.map((t, index) => (
              <span key={t.id || `${t.tag}-${t.tag_type || 'tag'}-${index}`} className={styles.tag}>
                {t.tag_type && <span className={styles.tagType}>{t.tag_type}</span>}
                {t.tag}
              </span>
            ))}
          </div>
        )}

        {/* Autor card */}
        {collab && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className={styles.authorCard}
          >
            <Link to={`/colaborador/${collab.slug}`} className={styles.authorCardMain}>
              <div className={styles.authorCardAvatarWrap}>
                {collab.photo_url ? (
                  <img
                    src={collab.photo_url}
                    alt={collab.name}
                    className={styles.authorCardAvatar}
                  />
                ) : (
                  <div className={styles.authorCardAvatarFallback}>
                    {collab.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>

              <div className={styles.authorCardInfo}>
                <div className={styles.authorCardLabel}>Sobre el autor</div>

                <div className={styles.authorCardName}>
                  {collab.name}
                </div>

                {collab.section_name && (
                  <div className={styles.authorCardSection}>{collab.section_name}</div>
                )}

                {collab.bio && (
                  <p className={styles.authorCardBio}>{collab.bio}</p>
                )}
              </div>
            </Link>

            {socialEntries.length > 0 && (
              <div className={styles.authorSocials}>
                {socialEntries.map(([net, url], index) => (
                  <a
                    key={`${net}-${index}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialIconLink}
                    aria-label={net}
                    title={net}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {renderSocialIcon(net)}
                  </a>
                ))}
              </div>
            )}
          </motion.div>
        )}
        {/* ── Barra de acciones centrada ─────────────────── */}
        <div className={styles.actionsBar}>
          {/* Like */}
          <LikeButton articleId={article.id} />

          {/* Comentar */}
          <button
            className={`${styles.actionIcon} ${showComments ? styles.actionIconActive : ''}`}
            onClick={() => setShowComments(p => !p)}
            title="Comentarios"
          >
            <span className={styles.actionIconWrap}>
              <MessageCircle size={22} />
            </span>
            <span className={styles.actionCount}>{commentCount}</span>
          </button>

          {/* Compartir */}
          <ShareButtons article={article} />
        </div>

        {/* ── Comentarios (se despliegan) ─────────────────── */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <Comments
                articleId={article.id}
                onCountChange={setCommentCount}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>

      {/* ── Image Viewer ───────────────────────────────────── */}
      {viewer && (
        <ImageViewer
          src={viewer.src}
          alt={viewer.alt}
          onClose={() => setViewer(null)}
        />
      )}

    </div>
  );
}

function ArticleSkeleton() {
  return (
    <div style={{ padding: '48px 24px', maxWidth: 760, margin: '0 auto' }}>
      {[300, 500, 60, 400, 400, 200].map((w, i) => (
        <div key={i} style={{
          height: i === 1 ? 48 : 20,
          width: `${Math.min(w, 700)}px`,
          maxWidth: '100%',
          background: 'var(--color-gray-200)',
          borderRadius: 4,
          marginBottom: 16,
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
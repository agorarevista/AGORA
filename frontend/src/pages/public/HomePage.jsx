import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getHome } from '../../api/articles.api';
import { cacheGet, cacheSet } from '../../utils/cache';
import { formatDate } from '../../utils/formatDate';
import {
  Clock,
  Eye,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Maximize2,
  Globe,
  Mail
} from 'lucide-react';
import ImageViewer from '../../components/common/ImageViewer/ImageViewer';
import agoraIcon from '../../assets/ICON.png';
import bookLight from '../../assets/BOOK.png';
import bookDark from '../../assets/BOOKW.png';
import styles from './HomePage.module.css';

const HOME_CACHE_KEY = 'home_payload';
const HOME_CACHE_BUSTER_KEY = 'home_payload_version';
/* ── Carousel hook ───────────────────────────────────── */
function useCarousel(items, perPage = 3, autoMs = 0) {
  const [idx, setIdx] = useState(0);
  const total = Math.ceil(items.length / perPage);
  const prev  = useCallback(() => setIdx(i => (i - 1 + total) % total), [total]);
  const next  = useCallback(() => setIdx(i => (i + 1) % total), [total]);
  const page  = items.slice(idx * perPage, idx * perPage + perPage);

  useEffect(() => {
    if (!autoMs || total <= 1) return;
    const t = setInterval(next, autoMs);
    return () => clearInterval(t);
  }, [autoMs, next, total]);

  return { page, idx, total, prev, next, setIdx };
}

export default function HomePage() {
  const [featured, setFeatured]         = useState([]);
  const [latest, setLatest]             = useState([]);
  const [edition, setEdition]           = useState(null);
  const [convocatoria, setConvocatoria] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [viewer, setViewer]             = useState(null); // { src, alt }
  const [isDark, setIsDark]             = useState(false);

  useEffect(() => {
    let mounted = true;

    const syncTheme = () => {
      const isDarkMode =
        document.documentElement.classList.contains('dark') ||
        document.body.classList.contains('dark') ||
        document.documentElement.getAttribute('data-theme') === 'dark' ||
        document.body.getAttribute('data-theme') === 'dark';

      if (mounted) setIsDark(isDarkMode);
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });

    const applyPayload = (payload) => {
      if (!mounted || !payload) return;

      setFeatured(Array.isArray(payload.featured) ? payload.featured : []);
      setLatest(Array.isArray(payload.latest) ? payload.latest : []);
      setEdition(payload.edition || null);
      setConvocatoria(payload.convocatoria || null);
      setCollaborators(Array.isArray(payload.collaborators) ? payload.collaborators : []);
    };

    const load = async ({ forceFresh = false } = {}) => {
      try {
        if (!forceFresh) {
          const cachedHome = cacheGet(HOME_CACHE_KEY);

          if (cachedHome && mounted) {
            applyPayload(cachedHome);
            setLoading(false);
          }
        } else {
          localStorage.removeItem(HOME_CACHE_KEY);
        }

        const data = await getHome();

        if (!mounted) return;

        const safePayload = {
          featured: Array.isArray(data?.featured) ? data.featured : [],
          latest: Array.isArray(data?.latest) ? data.latest : [],
          edition: data?.edition || null,
          convocatoria: data?.convocatoria || null,
          collaborators: Array.isArray(data?.collaborators) ? data.collaborators : [],
        };

        applyPayload(safePayload);

        cacheSet(HOME_CACHE_KEY, safePayload, 10 * 1000);
      } catch (e) {
        console.error('ERROR getHome()', e);

        if (!mounted) return;

               const cachedHome = cacheGet(HOME_CACHE_KEY);

        if (cachedHome) {
          setFeatured(Array.isArray(cachedHome.featured) ? cachedHome.featured : []);
          setLatest(Array.isArray(cachedHome.latest) ? cachedHome.latest : []);
          setEdition(cachedHome.edition || null);
          setConvocatoria(cachedHome.convocatoria || null);
          setCollaborators(Array.isArray(cachedHome.collaborators) ? cachedHome.collaborators : []);
        } else {
          setFeatured([]);
          setLatest([]);
          setEdition(null);
          setConvocatoria(null);
          setCollaborators([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const handleHomeInvalidation = () => {
      localStorage.removeItem(HOME_CACHE_KEY);
      load({ forceFresh: true });
    };

    const handleStorage = (event) => {
      if (event.key === HOME_CACHE_BUSTER_KEY) {
        handleHomeInvalidation();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        load({ forceFresh: true });
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('home-cache-invalidated', handleHomeInvalidation);
    document.addEventListener('visibilitychange', handleVisibility);

    load();

    return () => {
      mounted = false;
      observer.disconnect();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('home-cache-invalidated', handleHomeInvalidation);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);
  const recentArticles = latest.slice(0, 9);
  const newsItems      = useMemo(() => {
    const items = [...latest.slice(9, 16)];
    if (convocatoria) items.unshift({ _isConvo: true, ...convocatoria });
    return items;
  }, [latest, convocatoria]);

const mostRead = useMemo(() =>
  [...latest].sort((a,b) => (b.views||0)-(a.views||0)).slice(0,8)
, [latest]);

if (loading && !featured.length && !latest.length && !edition && !collaborators.length) {
  return <PageSkeleton />;
}

return (
  <div className={styles.page}>
    <div className={styles.shell}>

      {/* ── BLOQUE SUPERIOR ───────────────────────────── */}
      <div className={styles.mainGrid}>

        {/* ── IZQ: Portada edición ────────────────────── */}
        <div className={styles.editionCol}>
          <EditionCover edition={edition} setViewer={setViewer} />
        </div>

        {/* ── DER: Recientes + Colaboradores/Substack ─── */}
        <div className={styles.rightCol}>

          <div className={`${styles.block} ${styles.recentBlock}`}>
            <BlockHeader title="Artículos recientes" href="/buscar" />
            <RecentCarousel articles={recentArticles} />
          </div>

          <div className={styles.block2Col}>
<div className={`${styles.block} ${styles.collabsBlock}`}>
  <BlockHeader title="Colaboradores" href="/colaboradores" />
  <CollaboratorsCarousel collaborators={collaborators} />
</div>

            <div className={`${styles.block} ${styles.substackBlock}`}>
              <SubstackPanel />
            </div>
          </div>

        </div>
      </div>

      {/* ── BLOQUE INFERIOR ───────────────────────────── */}
      <div className={styles.lowerSections}>

        <div className={`${styles.block} ${styles.newsWideBlock}`}>
          <BlockHeader title="Noticias y convocatorias" />
          <NewsCarousel items={newsItems} />
        </div>

        <div className={styles.lowerGrid}>
          <div className={`${styles.block} ${styles.mostReadWideBlock}`}>
            <BlockHeader title="Más leídos" />
            <MostRead articles={mostRead} />
          </div>

          <div className={`${styles.block} ${styles.aboutBlock}`}>
            <BlockHeader title="Quiénes somos" />
            <AboutAgora isDark={isDark} />
          </div>
        </div>

      </div>

    </div>

    <AnimatePresence>
      {viewer && (
        <ImageViewer
          src={viewer.src}
          alt={viewer.alt || ''}
          onClose={() => setViewer(null)}
        />
      )}
    </AnimatePresence>
  </div>
);
}

/* ════════════════════════════════════════════════════════
   PORTADA DE EDICIÓN
════════════════════════════════════════════════════════ */
function EditionCover({ edition, setViewer }) {
  if (!edition) {
    return (
      <div className={styles.editionEmpty}>
        <span className={styles.editionEmptySymbol}>Λ</span>
        <p>Próximamente</p>
      </div>
    );
  }

  const handleOpenViewer = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!edition.cover_image_url) return;
    setViewer({
      src: edition.cover_image_url,
      alt: edition.name || `Edición ${edition.number}`
    });
  };

  return (
    <div className={styles.editionCard}>
      <button
        type="button"
        className={styles.editionImgButton}
        onClick={handleOpenViewer}
        aria-label={`Abrir portada de ${edition.name}`}
      >
        <div className={styles.editionImgWrap}>
          {edition.cover_image_url ? (
            <img
              src={edition.cover_image_url}
              alt={edition.name}
              className={styles.editionImg}
            />
          ) : (
            <div className={styles.editionImgPlaceholder}>
              <span>Λ</span>
            </div>
          )}

          <div className={styles.editionTopBadge}>
            <span className={styles.editionBadge}>Edición #{edition.number}</span>
          </div>

          <div className={styles.editionMetaOverlay}>
            <div className={styles.editionMetaGlass}>
              <span className={styles.editionKicker}>Edición actual</span>
              <h2 className={styles.editionName}>{edition.name}</h2>

              {edition.description && (
                <p className={styles.editionDesc}>{edition.description}</p>
              )}

              <div className={styles.editionActions}>
                <Link
                  to={`/edicion/${edition.number}`}
                  className={styles.editionCta}
                  onClick={(e) => e.stopPropagation()}
                >
                  Explorar edición <ArrowRight size={13} />
                </Link>

                {edition.cover_image_url && (
                  <span className={styles.editionZoomHint}>
                    <Maximize2 size={15} />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   CARRUSEL ARTÍCULOS RECIENTES
════════════════════════════════════════════════════════ */
function RecentCarousel({ articles }) {
  const { page, idx, total, prev, next, setIdx } = useCarousel(articles, 3, 6000);

  if (!articles.length) return <EmptySlot />;

  return (
    <div className={styles.carousel}>
      <div className={styles.carouselTrack}>
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            className={styles.carouselPage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.28 }}
          >
            {page.map(art => (
              <Link key={art.id} to={`/articulos/${art.slug}`} className={styles.recentCard}>
                <div className={styles.recentCardImg}>
                  {art.cover_image_url
                    ? <img src={art.cover_image_url} alt={art.title} />
                    : <div className={styles.imgPlaceholder}><span>Λ</span></div>
                  }
                </div>
                <div className={styles.recentCardBody}>
                  {art.article_categories?.[0]?.categories && (
                    <span className={styles.cat}>{art.article_categories[0].categories.name}</span>
                  )}
                  <div className={styles.recentCardTitle}>{art.title}</div>
                  <div className={styles.recentCardMeta}>
                    {art.collaborators && <span>{art.collaborators.name}</span>}
                    <span className={styles.dot}>·</span>
                    <span>{formatDate(art.published_at)}</span>
                    {art.reading_time && <><span className={styles.dot}>·</span><Clock size={10}/><span>{art.reading_time}′</span></>}
                  </div>
                  <div className={styles.recentCardStats}>
                    {art.views > 0 && <span className={styles.stat}><Eye size={11}/>{art.views}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {total > 1 && (
        <div className={styles.carouselControls}>
          <button className={styles.carouselBtn} onClick={prev}><ChevronLeft size={16}/></button>
          <div className={styles.carouselDots}>
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                className={`${styles.dot2} ${i === idx ? styles.dot2Active : ''}`}
                onClick={() => setIdx(i)}
              />
            ))}
          </div>
          <button className={styles.carouselBtn} onClick={next}><ChevronRight size={16}/></button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   COLABORADORES GRID
════════════════════════════════════════════════════════ */
function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5Zm8.88 2.12a1.12 1.12 0 1 1 0 2.25 1.12 1.12 0 0 1 0-2.25ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Z" />
    </svg>
  );
}

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.5 22v-8.2h2.77l.42-3.22H13.5V8.5c0-.93.26-1.56 1.6-1.56h1.71V4.06c-.3-.04-1.3-.12-2.47-.12-2.44 0-4.11 1.49-4.11 4.22v2.4H7.97v3.22h2.26V22h3.27Z" />
    </svg>
  );
}

function LinkedInIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3A2 2 0 1 0 5.3 7a2 2 0 0 0-.05-4ZM20.44 12.74c0-3.45-1.84-5.05-4.3-5.05-1.98 0-2.87 1.09-3.37 1.85V8.5H9.39c.04.69 0 11.5 0 11.5h3.38v-6.42c0-.34.02-.68.12-.92.27-.68.88-1.38 1.9-1.38 1.34 0 1.88 1.02 1.88 2.51V20H20v-6.86Z" />
    </svg>
  );
}

function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.9 2H21l-6.56 7.5L22.16 22h-6.04l-4.73-6.2L5.96 22H3.84l7.01-8.01L2 2h6.2l4.27 5.64L18.9 2Zm-1.06 18.2h1.68L7.3 3.7H5.5l12.34 16.5Z" />
    </svg>
  );
}

function CollaboratorsCarousel({ collaborators }) {
  const { page, idx, total, prev, next, setIdx } = useCarousel(collaborators, 1, 4500);

  if (!collaborators.length) return <EmptySlot />;

const getSocialLinks = (col) => {
  const social = col.social_links || {};

  const links = [
    {
      key: 'instagram',
      href:
        social.instagram ||
        social.instagram_url ||
        col.instagram_url ||
        col.instagram ||
        col.social_instagram,
      icon: <InstagramIcon className={styles.collabSocialIcon} />
    },
    {
      key: 'facebook',
      href:
        social.facebook ||
        social.facebook_url ||
        col.facebook_url ||
        col.facebook ||
        col.social_facebook,
      icon: <FacebookIcon className={styles.collabSocialIcon} />
    },
    {
      key: 'linkedin',
      href:
        social.linkedin ||
        social.linkedin_url ||
        col.linkedin_url ||
        col.linkedin ||
        col.social_linkedin,
      icon: <LinkedInIcon className={styles.collabSocialIcon} />
    },
    {
      key: 'x',
      href:
        social.x ||
        social.twitter ||
        social.twitter_url ||
        col.x_url ||
        col.twitter_url ||
        col.twitter,
      icon: <XIcon className={styles.collabSocialIcon} />
    },
    {
      key: 'website',
      href:
        social.website ||
        social.portfolio ||
        social.portfolio_url ||
        col.website_url ||
        col.website ||
        col.portfolio_url,
      icon: <Globe size={18} className={styles.collabSocialIcon} />
    },
    {
      key: 'email',
      href: col.email ? `mailto:${col.email}` : null,
      icon: <Mail size={18} className={styles.collabSocialIcon} />
    },
  ].filter((item) => !!item.href);

  return links;
};

  return (
    <div className={styles.collabCarousel}>
      <div className={styles.collabViewport}>
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            className={styles.collabPage}
            initial={{ opacity: 0, x: 22 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -22 }}
            transition={{ duration: 0.32 }}
          >
            {page.map((col) => {
              const socialLinks = getSocialLinks(col);

              return (
                <div
                  key={col.id}
                  className={styles.collabCard}
                >
                  <Link
                    to={`/colaborador/${col.slug || col.id}`}
                    className={styles.collabCardLink}
                  >
                    <div className={styles.collabAvatar}>
                      {col.photo_url ? (
                        <img
                          src={`${col.photo_url}${col.photo_url.includes('?') ? '&' : '?'}v=${encodeURIComponent(col.updated_at || col.id || col.slug || '1')}`}
                          alt={col.name}
                        />
                      ) : (
                        <span>{(col.name || '?')[0].toUpperCase()}</span>
                      )}
                    </div>

                    <div className={styles.collabInfo}>
                      <div className={styles.collabTextGroup}>
                        <div className={styles.collabName}>{col.name}</div>

                        {col.section_name && (
                          <div className={styles.collabSection}>{col.section_name}</div>
                        )}
                      </div>
                    </div>
                  </Link>

                  {socialLinks.length > 0 && (
                    <div className={styles.collabSocialsWrap}>
                      <div className={styles.collabSocials}>
                        {socialLinks.map((item) => (
                          <a
                            key={item.key}
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.collabSocial}
                            aria-label={item.key}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.icon}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {total > 1 && (
          <>
            <button
              type="button"
              className={`${styles.collabArrow} ${styles.collabArrowLeft}`}
              onClick={prev}
              aria-label="Colaborador anterior"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              className={`${styles.collabArrow} ${styles.collabArrowRight}`}
              onClick={next}
              aria-label="Siguiente colaborador"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {total > 1 && (
        <div className={styles.collabDots}>
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.dot2} ${i === idx ? styles.dot2Active : ''}`}
              onClick={() => setIdx(i)}
              aria-label={`Ir al colaborador ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   MÁS LEÍDOS
════════════════════════════════════════════════════════ */
function MostRead({ articles }) {
  if (!articles.length) return <EmptySlot />;

  const getLikes = (art) =>
    art.likes_count ?? art.likes ?? art.like_count ?? 0;

  const getShares = (art) =>
    art.share_count ?? art.shares ?? art.shared_count ?? 0;

  return (
    <div className={styles.mostReadList}>
      {articles.map((art, i) => (
        <Link key={art.id} to={`/articulos/${art.slug}`} className={styles.mostReadItem}>
          <span className={styles.mostReadNum}>{i + 1}</span>

          <div className={styles.mostReadBody}>
            <div className={styles.mostReadTitle}>{art.title}</div>

            <div className={styles.mostReadStats}>
              {art.views > 0 && (
                <span className={styles.stat}>
                  <Eye size={11} />
                  {art.views}
                </span>
              )}

              {getLikes(art) > 0 && (
                <span className={styles.stat}>
                  <Heart size={11} />
                  {getLikes(art)}
                </span>
              )}

              {getShares(art) > 0 && (
                <span className={styles.stat}>
                  <Share2 size={11} />
                  {getShares(art)}
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
function AboutAgora({ isDark }) {
  return (
    <div className={styles.aboutAgoraRich}>
      <div className={styles.aboutAgoraVisualImageWrap}>
        <img
          src={isDark ? bookDark : bookLight}
          alt="Agorá Revista"
          className={styles.aboutAgoraVisualImage}
        />
      </div>

      <div className={styles.aboutAgoraContent}>
        <div className={styles.aboutAgoraEyebrow}>Agorá Revista</div>

        <h3 className={styles.aboutAgoraTitle}>
          Arte, palabra y mirada crítica en un mismo espacio
        </h3>

        <p className={styles.aboutAgoraText}>
          En Agorá Revista creemos en el poder del arte y la palabra como puntos
          de encuentro. Por ello, abrimos una invitación a artistas, escritores,
          fotógrafos, cineastas, periodistas y creadores que deseen compartir su
          trabajo, sus ideas y su mirada sobre el mundo.
        </p>

        <Link to="/acerca-de" className={styles.aboutAgoraLink}>
          Conocer más <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
/* ════════════════════════════════════════════════════════
   CARRUSEL NOTICIAS + CONVOCATORIAS
════════════════════════════════════════════════════════ */
function NewsCarousel({ items }) {
  const { page, idx, total, prev, next, setIdx } = useCarousel(items, 2, 7000);

  if (!items.length) return <EmptySlot />;

  return (
    <div className={styles.carousel}>
      <div className={styles.carouselTrack}>
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            className={styles.newsPage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.28 }}
          >
            {page.map((item, i) =>
              item._isConvo ? (
                <Link key={`convo-${i}`} to={`/convocatoria/${item.id}`} className={`${styles.newsCard} ${styles.newsCardConvo}`}>
                  <div className={styles.newsCardLabel}>Convocatoria abierta</div>
                  <div className={styles.newsCardTitle}>{item.title}</div>
                  <div className={styles.newsCardCta}>Participar →</div>
                </Link>
              ) : (
                <Link key={item.id} to={`/articulos/${item.slug}`} className={styles.newsCard}>
                  {item.cover_image_url && (
                    <div className={styles.newsCardImg}>
                      <img src={item.cover_image_url} alt={item.title} />
                    </div>
                  )}
                  <div className={styles.newsCardContent}>
                    {item.article_categories?.[0]?.categories && (
                      <span className={styles.cat}>{item.article_categories[0].categories.name}</span>
                    )}
                    <div className={styles.newsCardTitle}>{item.title}</div>
                    <div className={styles.newsCardMeta}>
                      {item.collaborators && <span>{item.collaborators.name}</span>}
                      <span className={styles.dot}>·</span>
                      <span>{formatDate(item.published_at)}</span>
                    </div>
                  </div>
                </Link>
              )
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {total > 1 && (
        <div className={styles.carouselControls}>
          <button className={styles.carouselBtn} onClick={prev}><ChevronLeft size={16}/></button>
          <div className={styles.carouselDots}>
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                className={`${styles.dot2} ${i === idx ? styles.dot2Active : ''}`}
                onClick={() => setIdx(i)}
              />
            ))}
          </div>
          <button className={styles.carouselBtn} onClick={next}><ChevronRight size={16}/></button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   PANEL SUBSTACK
════════════════════════════════════════════════════════ */
function SubstackPanel() {
  return (
    <div className={styles.substackClean}>

      <img
        src={agoraIcon}
        alt="Agorá Revista"
        className={styles.substackLogo}
      />

      <div className={styles.substackCleanContent}>

        <h3 className={styles.substackTitleClean}>
          Agorá Revista
        </h3>

        <p className={styles.substackTextClean}>
          Revista digital dedicada a la difusión cultural y artística
        </p>

        <a
          href="https://agorarevista.substack.com"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.substackBtnClean}
        >
          Suscribirme →
        </a>

      </div>

    </div>
  );
}

/* ════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════ */
function BlockHeader({ title, href }) {
  return (
    <div className={styles.blockHeader}>
      <span className={styles.blockTitle}>{title}</span>
      {href && <Link to={href} className={styles.blockMore}>Ver todos →</Link>}
    </div>
  );
}

function EmptySlot() {
  return (
    <div className={styles.emptySlot}>
      <span>Λ</span>
      <p>Próximamente</p>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skeletonLeft} />
      <div className={styles.skeletonRight}>
        {[1,2,3].map(i => <div key={i} className={styles.skeletonBlock} />)}
      </div>
    </div>
  );
}
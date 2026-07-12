import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getHome } from '../../api/articles.api';
import { getActiveConvocatorias } from '../../api/convocatorias.api';
import { cacheGet, cacheSet } from '../../utils/cache';
import { formatDate } from '../../utils/formatDate';
import { getSponsors } from '../../api/sponsors.api';
import {
  Clock,
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
const [featured, setFeatured]           = useState([]);
  const [latest, setLatest]               = useState([]);
  const [edition, setEdition]             = useState(null);
  const [convocatoria, setConvocatoria]   = useState(null);
  const [convocatorias, setConvocatorias] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [sponsors, setSponsors]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [viewer, setViewer]               = useState(null);
  const [isDark, setIsDark]               = useState(false);

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

// Fetch convocatorias activas por separado
        try {
          const convs = await getActiveConvocatorias();
          if (mounted) setConvocatorias(Array.isArray(convs) ? convs : []);
        } catch {}

        // Fetch sponsors y noticias
        try {
          const sp = await getSponsors();
          if (mounted) setSponsors(Array.isArray(sp) ? sp : []);
        } catch {}
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

const edicionArticles = useMemo(() =>
  edition ? latest.filter(a => a.editions?.id === edition.id) : []
, [latest, edition]);

if (loading && !featured.length && !latest.length && !edition && !collaborators.length) {
  return <PageSkeleton />;
}

return (
  <div className={styles.page}>
    <div className={styles.shell}>

{/* ── PORTADA CENTRAL + HIGHLIGHTS ──────────────── */}
      {featured.length > 0 && (
        <div className={styles.heroGrid}>
          <div className={styles.heroSideCol}>
            {featured.slice(0, 2).map(art => (
              <HighlightCard key={art.id} art={art} />
            ))}
          </div>

          <div className={styles.heroCenterCol}>
            <EditionCover edition={edition} setViewer={setViewer} />
          </div>

          <div className={styles.heroSideCol}>
            {featured.slice(2, 4).map(art => (
              <HighlightCard key={art.id} art={art} />
            ))}
          </div>
        </div>
      )}
{/* ── TRÍPTICO EDITORIAL: COLABORADORES + SUBSTACK + RANKING ── */}
<div className={styles.editorialTriptychGrid}>

  <div className={`${styles.block} ${styles.triptychCollabsBlock}`}>
    <BlockHeader title="Colaboradores" href="/colaboradores" />
    <CollaboratorsCarousel collaborators={collaborators} />
  </div>

  <div className={`${styles.block} ${styles.triptychSubstackBlock}`}>
    <SubstackPanel />
  </div>

  <div className={`${styles.block} ${styles.triptychRankingBlock}`}>
    <BlockHeader title="Los más leídos" href="/buscar" />
    <MostRead articles={mostRead.slice(0, 5)} variant="triptych" />
  </div>

</div>
{/* ── SPONSORS Y NOTICIAS ──────────────────────── */}
      {sponsors.length > 0 && (
        <section className={styles.sponsorsSection}>
          <div className={styles.featureSectionHeader}>
            <div>
              <span className={styles.featureEyebrow}>Comunidad</span>
              <h2 className={styles.featureTitle}>Sponsors y Noticias</h2>
            </div>
          </div>
          <SponsorsCarousel items={sponsors} />
        </section>
      )}

      {/* ── CARRUSEL EDICIÓN ACTUAL ──────────────────── */}
      {edicionArticles.length > 0 && (
        <section className={styles.edicionSection}>
          <div className={styles.featureSectionHeader}>
            <div>
              <span className={styles.featureEyebrow}>Explora Agorá</span>
              <h2 className={styles.featureTitle}>Todo Nuestro Contenido</h2>
            </div>
          </div>
          <EdicionCarousel articles={edicionArticles} />
        </section>
      )}


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

  const getPhotoCrop = (url = '') => {
    const cleanUrl = url.split('#crop=')[0];
    const cropRaw = url.split('#crop=')[1];

    if (!cropRaw) {
      return {
        cleanUrl,
        x: 50,
        y: 20,
        zoom: 1,
      };
    }

    const [x, y, zoom] = cropRaw.split(',').map(Number);

    return {
      cleanUrl,
      x: Number.isFinite(x) ? x : 50,
      y: Number.isFinite(y) ? y : 20,
      zoom: Number.isFinite(zoom) ? zoom : 1,
    };
  };

  const getSocialLinks = (col) => {
    const social = col.social_links || {};

    return [
      {
        key: 'instagram',
        href: social.instagram || social.instagram_url || col.instagram_url || col.instagram || col.social_instagram,
        icon: <InstagramIcon className={styles.collabSocialIcon} />
      },
      {
        key: 'facebook',
        href: social.facebook || social.facebook_url || col.facebook_url || col.facebook || col.social_facebook,
        icon: <FacebookIcon className={styles.collabSocialIcon} />
      },
      {
        key: 'linkedin',
        href: social.linkedin || social.linkedin_url || col.linkedin_url || col.linkedin || col.social_linkedin,
        icon: <LinkedInIcon className={styles.collabSocialIcon} />
      },
      {
        key: 'x',
        href: social.x || social.twitter || social.twitter_url || col.x_url || col.twitter_url || col.twitter,
        icon: <XIcon className={styles.collabSocialIcon} />
      },
      {
        key: 'website',
        href: social.website || social.portfolio || social.portfolio_url || col.website_url || col.website || col.portfolio_url,
        icon: <Globe size={18} className={styles.collabSocialIcon} />
      },
      {
        key: 'email',
        href: col.email ? `mailto:${col.email}` : null,
        icon: <Mail size={18} className={styles.collabSocialIcon} />
      },
    ].filter((item) => !!item.href);
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
              const crop = getPhotoCrop(col.photo_url || '');

              return (
                <div key={col.id} className={styles.collabCard}>
                  <Link
                    to={`/colaborador/${col.slug || col.id}`}
                    className={styles.collabCardLink}
                  >
                    <div className={styles.collabAvatar}>
                      {col.photo_url ? (
                        <img
                          src={`${crop.cleanUrl}${crop.cleanUrl.includes('?') ? '&' : '?'}v=${encodeURIComponent(col.updated_at || col.id || col.slug || '1')}`}
                          alt={col.name}
                          style={{
                            objectPosition: `${crop.x}% ${crop.y}%`,
                            transform: `scale(${crop.zoom})`,
                          }}
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
function MostRead({ articles, variant = 'default' }) {
  if (!articles.length) return <EmptySlot />;

  const roman = ['I', 'II', 'III', 'IV', 'V'];

  if (variant === 'triptych') {
    return (
      <div className={styles.triptychRankingList}>
        {articles.map((art, i) => {
          const authorName = art.collaborators?.name || 'Agorá Revista';
          const sectionName =
            art.article_categories?.[0]?.categories?.name ||
            art.categories?.[0]?.name ||
            '';

          return (
            <Link
              key={art.id}
              to={`/articulos/${art.slug}`}
              className={styles.triptychRankingItem}
            >
              <div className={styles.triptychRankingNum}>{roman[i]}</div>

              <div className={styles.triptychRankingContent}>
                <div className={styles.triptychRankingText}>
                  <h3 className={styles.triptychRankingTitle}>{art.title}</h3>

                  <div className={styles.triptychRankingMeta}>
                    <span>{authorName}</span>
                    {sectionName && (
                      <>
                        <span className={styles.dot}>·</span>
                        <span>{sectionName}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className={styles.triptychRankingImg}>
                  {art.cover_image_url ? (
                    <img src={art.cover_image_url} alt={art.title} />
                  ) : (
                    <div className={styles.imgPlaceholder}><span>Λ</span></div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

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

        <Link to="/quienes-somos" className={styles.aboutAgoraLink}>
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
    <a
      href="https://agorarevista.substack.com"
      target="_blank"
      rel="noopener noreferrer"
      className={styles.substackClean}
    >
      <img
        src={agoraIcon}
        alt="Agorá Revista"
        className={styles.substackLogo}
      />

      <div className={styles.substackCleanContent}>
        <span className={styles.substackLabel}>Lectura extendida</span>

        <h3 className={styles.substackTitleClean}>
          Agorá en Substack
        </h3>

        <p className={styles.substackTextClean}>
          Ensayos, columnas y textos editoriales para leer con calma.
        </p>

        <span className={styles.substackBtnClean}>
          Suscribirme →
        </span>
      </div>
    </a>
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
/* ════════════════════════════════════════════════════════
   CONVOCATORIAS GRID (HOMEPAGE)
════════════════════════════════════════════════════════ */
function ConvocatoriasGrid({ convocatorias }) {
  if (!convocatorias.length) {
    return (
      <div className={styles.convEmpty}>
        <span>◈</span>
        <p>No hay convocatorias abiertas en este momento</p>
      </div>
    );
  }
  return (
    <div className={styles.convGrid}>
      {convocatorias.map((conv, i) => (
        <ConvocatoriaCard key={conv.id} conv={conv} index={i} />
      ))}
    </div>
  );
}

function ConvocatoriaCard({ conv, index }) {
  const now      = new Date();
  const deadline = conv.closes_at ? new Date(conv.closes_at) : null;
  const isPast   = deadline && deadline < now;
  const daysLeft = deadline && !isPast
    ? Math.ceil((deadline - now) / (1000*60*60*24)) : null;

  const accentBgs = ['var(--color-accent)', '#B8860B', '#1B4F8A'];
  const badgeBg   = accentBgs[index % accentBgs.length];

  return (
    <Link to={`/convocatoria/${conv.id}`} className={styles.convCard}>
      {/* Imagen */}
      <div className={styles.convCardMedia}>
        {conv.cover_image_url
          ? <img src={conv.cover_image_url} alt={conv.title} />
          : <div className={styles.convCardMediaPlaceholder}>◈</div>
        }

        {/* Badge días */}
        {deadline && (
          <div className={styles.convCardDeadline} style={{ background: badgeBg }}>
            {isPast ? (
              <span className={styles.convCardDeadlineLabel}>Cerrada</span>
            ) : (
              <>
                <span className={styles.convCardDeadlineDays}>{daysLeft}</span>
                <span className={styles.convCardDeadlineUnit}>días</span>
              </>
            )}
          </div>
        )}

        {/* Badges categorías */}
        {conv.categories?.length > 0 && (
          <div className={styles.convCardCatBadges}>
            {conv.categories.slice(0, 2).map(cat => (
              <span key={cat} className={styles.convCardCatBadge}>{cat}</span>
            ))}
          </div>
        )}
      </div>

      {/* Cuerpo */}
      <div className={styles.convCardBody}>
        <h3 className={styles.convCardTitle}>{conv.title}</h3>
        {conv.description && (
          <p className={styles.convCardDesc}>{conv.description}</p>
        )}
        {conv.contact_email && (
          <div className={styles.convCardEmail}>{conv.contact_email}</div>
        )}
        <div className={styles.convCardCta}>VER CONVOCATORIA →</div>
      </div>
    </Link>
  );
}
function SponsorsCarousel({ items }) {
  const trackRef = useRef(null);

  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' });
  };

  const typeLabel = (t) => {
    if (t === 'sponsor') return 'Sponsor';
    if (t === 'patrocinador') return 'Patrocinador';
    return 'Noticia';
  };

  return (
    <div className={styles.sponsorsCarousel}>
      <button
        type="button"
        className={`${styles.edicionArrow} ${styles.edicionArrowLeft}`}
        onClick={() => scroll(-1)}
        aria-label="Anterior"
      >
        <ChevronLeft size={20} />
      </button>

      <div ref={trackRef} className={styles.sponsorsTrack}>
        {items.map(item => {
          const Wrapper = item.link_url ? 'a' : 'div';
          const wrapperProps = item.link_url
            ? { href: item.link_url, target: '_blank', rel: 'noopener noreferrer' }
            : {};

          return (
            <Wrapper
              key={item.id}
              {...wrapperProps}
              className={`${styles.sponsorCard} ${!item.image_url ? styles.sponsorCardEditorial : ''}`}
            >
              <span className={styles.sponsorType} data-type={item.type}>
                {typeLabel(item.type)}
              </span>

              {item.image_url ? (
                <div className={styles.sponsorImg}>
                  <img src={item.image_url} alt={item.title} />
                </div>
              ) : (
                <div className={styles.sponsorGreek}>
                  <span className={styles.sponsorGreekSymbol}>Λ</span>
                </div>
              )}

              <div className={styles.sponsorBody}>
                <div className={styles.sponsorTitle}>{item.title}</div>
                {item.body && <p className={styles.sponsorText}>{item.body}</p>}
                {item.link_url && (
                  <span className={styles.sponsorCta}>Ver más →</span>
                )}
              </div>
            </Wrapper>
          );
        })}
      </div>

      <button
        type="button"
        className={`${styles.edicionArrow} ${styles.edicionArrowRight}`}
        onClick={() => scroll(1)}
        aria-label="Siguiente"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
function EdicionCarousel({ articles }) {
  const trackRef = useRef(null);

  const [isMobile, setIsMobile] = useState(false);
  const [mobilePage, setMobilePage] = useState(0);

  const mobilePerPage = 4;
  const mobileTotalPages = Math.ceil(articles.length / mobilePerPage);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 600px)');

    const updateMobileState = () => {
      setIsMobile(mediaQuery.matches);
    };

    updateMobileState();

    mediaQuery.addEventListener('change', updateMobileState);

    return () => {
      mediaQuery.removeEventListener('change', updateMobileState);
    };
  }, []);

  useEffect(() => {
    if (mobilePage >= mobileTotalPages) {
      setMobilePage(Math.max(0, mobileTotalPages - 1));
    }
  }, [mobilePage, mobileTotalPages]);

  const visibleArticles = isMobile
    ? articles.slice(
        mobilePage * mobilePerPage,
        mobilePage * mobilePerPage + mobilePerPage
      )
    : articles;

  const scroll = (dir) => {
    const el = trackRef.current;

    if (!el) return;

    el.scrollBy({
      left: dir * el.clientWidth,
      behavior: 'smooth',
    });
  };

  const previousMobilePage = () => {
    setMobilePage((currentPage) =>
      currentPage === 0
        ? mobileTotalPages - 1
        : currentPage - 1
    );
  };

  const nextMobilePage = () => {
    setMobilePage((currentPage) =>
      currentPage === mobileTotalPages - 1
        ? 0
        : currentPage + 1
    );
  };

  const getCategories = (art) => {
    const fromPivot = Array.isArray(art.article_categories)
      ? art.article_categories
          .map((item) => item?.categories?.name)
          .filter(Boolean)
      : [];

    const fromDirect = Array.isArray(art.categories)
      ? art.categories
          .map((cat) => cat?.name || cat)
          .filter(Boolean)
      : [];

    return [...new Set([...fromPivot, ...fromDirect])].slice(0, 2);
  };

  return (
    <div className={styles.edicionCarousel}>
      {!isMobile && articles.length > 5 && (
        <button
          type="button"
          className={`${styles.edicionArrow} ${styles.edicionArrowLeft}`}
          onClick={() => scroll(-1)}
          aria-label="Mostrar artículos anteriores"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      <div ref={trackRef} className={styles.edicionTrack}>
        {visibleArticles.map((art) => {
          const categories = getCategories(art);

          return (
            <Link
              key={art.id}
              to={`/articulos/${art.slug}`}
              className={styles.edicionCard}
            >
              <div className={styles.edicionCardImg}>
                {art.cover_image_url ? (
                  <img
                    src={art.cover_image_url}
                    alt={art.title}
                  />
                ) : (
                  <div className={styles.imgPlaceholder}>
                    <span>Λ</span>
                  </div>
                )}

                <div className={styles.edicionCardOverlay}>
                  {categories.length > 0 && (
                    <div className={styles.edicionCardCats}>
                      {categories.map((cat) => (
                        <span
                          key={cat}
                          className={styles.edicionCardCat}
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className={styles.edicionCardText}>
                    <h3 className={styles.edicionCardTitle}>
                      {art.title}
                    </h3>

                    {art.collaborators && (
                      <p className={styles.edicionCardAuthor}>
                        {art.collaborators.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {!isMobile && articles.length > 5 && (
        <button
          type="button"
          className={`${styles.edicionArrow} ${styles.edicionArrowRight}`}
          onClick={() => scroll(1)}
          aria-label="Mostrar siguientes artículos"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {isMobile && mobileTotalPages > 1 && (
        <div className={styles.edicionMobileControls}>
          <button
            type="button"
            className={styles.edicionMobileArrow}
            onClick={previousMobilePage}
            aria-label="Página anterior"
          >
            <ChevronLeft size={20} />
          </button>

          <div className={styles.edicionMobileDots}>
            {Array.from({ length: mobileTotalPages }).map((_, index) => (
              <button
                key={index}
                type="button"
                className={`${styles.edicionMobileDot} ${
                  index === mobilePage
                    ? styles.edicionMobileDotActive
                    : ''
                }`}
                onClick={() => setMobilePage(index)}
                aria-label={`Ir a la página ${index + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            className={styles.edicionMobileArrow}
            onClick={nextMobilePage}
            aria-label="Siguiente página"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

function HighlightCard({ art }) {
  return (
    <Link to={`/articulos/${art.slug}`} className={styles.highlightCard}>
      <div className={styles.highlightImg}>
        {art.cover_image_url ? (
          <img src={art.cover_image_url} alt={art.title} />
        ) : (
          <div className={styles.imgPlaceholder}><span>Λ</span></div>
        )}

        <div className={styles.highlightOverlay}>
          <div className={styles.highlightTitle}>{art.title}</div>

          {art.collaborators && (
            <div className={styles.highlightAuthor}>
              {art.collaborators.name}
            </div>
          )}
        </div>
      </div>
    </Link>
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
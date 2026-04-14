import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getFeatured, getArticles } from '../../api/articles.api';
import { getCurrentEdition } from '../../api/editions.api';
import { getActiveConvocatorias } from '../../api/convocatorias.api';
import { cacheGet, cacheSet } from '../../utils/cache';
import { formatDate } from '../../utils/formatDate';
import { Clock, Eye } from 'lucide-react';
import styles from './HomePage.module.css';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.5, ease: 'easeOut', delay }
});

export default function HomePage() {
  const [featured, setFeatured]         = useState([]);
  const [latest, setLatest]             = useState([]);
  const [edition, setEdition]           = useState(null);
  const [convocatoria, setConvocatoria] = useState(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const cachedF = cacheGet('featured');
        if (cachedF) setFeatured(cachedF);
        else {
          const f = await getFeatured();
          setFeatured(f);
          cacheSet('featured', f, 10 * 60 * 1000);
        }

        const cachedL = cacheGet('latest_home');
        if (cachedL) setLatest(cachedL);
        else {
          const l = await getArticles({ limit: 12 });
          setLatest(l.data);
          cacheSet('latest_home', l.data, 10 * 60 * 1000);
        }

        const cachedE = cacheGet('current_edition');
        if (cachedE) setEdition(cachedE);
        else {
          const e = await getCurrentEdition();
          setEdition(e);
          cacheSet('current_edition', e);
        }

        const convs = await getActiveConvocatorias();
        if (convs.length > 0) setConvocatoria(convs[0]);

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const hero    = featured[0] || null;
  const subHero = featured.slice(1, 3);
  const rest    = featured.slice(3);

  if (loading) return <PageSkeleton />;

  return (
    <div className={styles.page}>

      {/* ── Banner convocatoria ─────────────────────────── */}
      {convocatoria && (
        <motion.div {...fadeUp(0)} className={styles.convoBanner}>
          <span className={styles.convoBadge}>Convocatoria abierta</span>
          <span className={styles.convoTitle}>{convocatoria.title}</span>
          <Link to={`/convocatoria/${convocatoria.id}`} className={styles.convoBtn}>
            Participar →
          </Link>
        </motion.div>
      )}

      {/* ── Hero principal ──────────────────────────────── */}
      {hero && (
        <section className={styles.heroSection}>
          <motion.div {...fadeUp(0)} className={styles.heroMain}>
            <Link to={`/articulos/${hero.slug}`} className={styles.heroCard}>
              <div className={styles.heroImg}>
                {hero.cover_image_url
                  ? <img src={hero.cover_image_url} alt={hero.title} />
                  : <div className={styles.heroImgPlaceholder}><span>Λ</span></div>
                }
                <div className={styles.heroOverlay} />
              </div>
              <div className={styles.heroContent}>
                {hero.article_categories?.[0]?.categories && (
                  <span className={styles.heroCategory}>
                    {hero.article_categories[0].categories.name}
                  </span>
                )}
                <h1 className={styles.heroTitle}>{hero.title}</h1>
                {hero.subtitle && (
                  <p className={styles.heroSubtitle}>{hero.subtitle}</p>
                )}
                <div className={styles.heroMeta}>
                  {hero.collaborators && <span>{hero.collaborators.name}</span>}
                  <span className={styles.dot}>·</span>
                  <span>{formatDate(hero.published_at)}</span>
                  {hero.reading_time && (
                    <>
                      <span className={styles.dot}>·</span>
                      <Clock size={12} />
                      <span>{hero.reading_time} min</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>

          {subHero.length > 0 && (
            <div className={styles.heroSide}>
              {subHero.map((art, i) => (
                <motion.div key={art.id} {...fadeUp(0.1 + i * 0.1)}>
                  <Link to={`/articulos/${art.slug}`} className={styles.sideCard}>
                    <div className={styles.sideImg}>
                      {art.cover_image_url
                        ? <img src={art.cover_image_url} alt={art.title} />
                        : <div className={styles.sideImgPlaceholder}><span>Λ</span></div>
                      }
                    </div>
                    <div className={styles.sideContent}>
                      {art.article_categories?.[0]?.categories && (
                        <span className={styles.cardCategory}>
                          {art.article_categories[0].categories.name}
                        </span>
                      )}
                      <h3 className={styles.sideTitle}>{art.title}</h3>
                      <div className={styles.cardMeta}>
                        {art.collaborators && <span>{art.collaborators.name}</span>}
                        <span className={styles.dot}>·</span>
                        <span>{formatDate(art.published_at)}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      <div className={styles.meander} />

      {/* ── Edición actual — CENTRADA ───────────────────── */}
      {edition && (
        <section className={styles.editionSection}>
          <div className="container">
            {/* Cabecera centrada */}
            <motion.div {...fadeUp(0)} className={styles.editionHeader}>
              {edition.cover_image_url && (
                <div className={styles.editionCover}>
                  <img src={edition.cover_image_url} alt={edition.name} />
                </div>
              )}
              <div className={styles.editionMeta}>
                <div className={styles.editionNumber}>№ {edition.number}</div>
                <h2 className={styles.editionName}>{edition.name}</h2>
                {edition.description && (
                  <p className={styles.editionDesc}>{edition.description}</p>
                )}
                <Link to={`/edicion/${edition.number}`} className={styles.editionBtn}>
                  Ver edición completa →
                </Link>
              </div>
            </motion.div>

            {/* Grid de artículos de la edición */}
            {edition.articles && edition.articles.length > 0 && (
              <div className={styles.editionGrid}>
                {edition.articles.slice(0, 6).map((art, i) => (
                  <motion.div key={art.id} {...fadeUp(i * 0.07)}>
                    <ArticleCard article={art} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <div className={styles.meander} />

      {/* ── Más destacados ──────────────────────────────── */}
      {rest.length > 0 && (
        <section className={styles.featuredExtra}>
          <div className="container">
            <motion.div {...fadeUp(0)} className={styles.sectionHeader}>
              <div className={styles.sectionLabel}>Destacados</div>
              <h2 className={styles.sectionTitle}>También recomendamos</h2>
            </motion.div>
            <div className={styles.extraGrid}>
              {rest.map((art, i) => (
                <motion.div key={art.id} {...fadeUp(i * 0.07)}>
                  <ArticleCard article={art} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className={styles.meander} />

      {/* ── Últimas publicaciones — estilo Substack ─────── */}
      {latest.length > 0 && (
        <section className={styles.latestSection}>
          <div className={styles.latestInner}>

            {/* Lista principal */}
            <div className={styles.latestList}>
              <motion.div {...fadeUp(0)} className={styles.sectionHeader}>
                <div className={styles.sectionLabel}>Lo más reciente</div>
                <h2 className={styles.sectionTitle}>Últimas publicaciones</h2>
              </motion.div>
              {latest.map((art, i) => (
                <motion.div key={art.id} {...fadeUp(i * 0.05)}>
                  <SubstackCard article={art} />
                </motion.div>
              ))}
            </div>

            {/* Sidebar de secciones */}
            <aside className={styles.latestSidebar}>
              <div className={styles.sidebarWidget}>
                <div className={styles.widgetTitle}>Secciones</div>
                <SectionsList />
              </div>
            </aside>

          </div>
        </section>
      )}

    </div>
  );
}

// ── Card estilo grid ──────────────────────────────────────────────────────
function ArticleCard({ article: art }) {
  return (
    <Link to={`/articulos/${art.slug}`} className={styles.articleCard}>
      <div className={styles.articleImg}>
        {art.cover_image_url
          ? <img src={art.cover_image_url} alt={art.title} />
          : <div className={styles.imgPlaceholder}><span>Λ</span></div>
        }
      </div>
      <div className={styles.articleContent}>
        {art.article_categories?.[0]?.categories && (
          <span className={styles.cardCategory}>
            {art.article_categories[0].categories.name}
          </span>
        )}
        <h3 className={styles.articleTitle}>{art.title}</h3>
        {art.excerpt && (
          <p className={styles.articleExcerpt}>{art.excerpt}</p>
        )}
        <div className={styles.cardMeta}>
          {art.collaborators && <span>{art.collaborators.name}</span>}
          <span className={styles.dot}>·</span>
          <span>{formatDate(art.published_at)}</span>
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
  );
}

// ── Card estilo Substack (horizontal) ────────────────────────────────────
function SubstackCard({ article: art }) {
  return (
    <Link to={`/articulos/${art.slug}`} className={styles.substackCard}>
      <div className={styles.substackContent}>
        {art.article_categories?.[0]?.categories && (
          <span className={styles.substackCategory}>
            {art.article_categories[0].categories.name}
          </span>
        )}
        <h3 className={styles.substackTitle}>{art.title}</h3>
        {art.subtitle && (
          <p className={styles.substackSubtitle}>{art.subtitle}</p>
        )}
        <div className={styles.substackMeta}>
          {art.collaborators && <span className={styles.substackAuthor}>{art.collaborators.name}</span>}
          <span className={styles.dot}>·</span>
          <span>{formatDate(art.published_at)}</span>
          {art.reading_time && (
            <>
              <span className={styles.dot}>·</span>
              <Clock size={11} />
              <span>{art.reading_time} min</span>
            </>
          )}
        </div>
      </div>
      {art.cover_image_url && (
        <div className={styles.substackImg}>
          <img src={art.cover_image_url} alt={art.title} />
        </div>
      )}
    </Link>
  );
}

// ── Lista de secciones en sidebar ─────────────────────────────────────────
function SectionsList() {
  const [cats, setCats] = useState([]);
  useEffect(() => {
    const cached = cacheGet('categories');
    if (cached) { setCats(cached); return; }
    import('../../api/categories.api').then(({ getCategories }) => {
      getCategories().then(data => {
        setCats(data);
        cacheSet('categories', data);
      }).catch(() => {});
    });
  }, []);

  return (
    <div className={styles.sectionLinks}>
      {cats.map(cat => (
        <Link key={cat.id} to={`/categoria/${cat.slug}`} className={styles.sectionLink}>
          <span>{cat.name}</span>
          <span className={styles.sectionArrow}>→</span>
        </Link>
      ))}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skeletonHero} />
      <div className={styles.skeletonGrid}>
        {[1,2,3].map(i => <div key={i} className={styles.skeletonCard} />)}
      </div>
    </div>
  );
}
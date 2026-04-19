import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getByCategory as getArticlesByCategory } from '../../api/articles.api';
import { getCategories } from '../../api/categories.api';
import { formatDate } from '../../utils/formatDate';
import { Clock, Eye, ArrowLeft, Globe, Mail } from 'lucide-react';
import styles from './CategoryPage.module.css';

export default function CategoryPage() {
  const { slug } = useParams();
  const [articles, setArticles] = useState([]);
  const [category, setCategory] = useState(null);
  const [subcats, setSubcats]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const LIMIT = 12;

  useEffect(() => {
    setPage(1);
    setArticles([]);
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getArticlesByCategory(slug, { page, limit: LIMIT }),
      getCategories(),
    ]).then(([res, cats]) => {
      setArticles(prev => page === 1 ? (res.data || []) : [...prev, ...(res.data || [])]);
      setTotal(res.total || 0);
      const all  = cats;
      const cat  = all.find(c => c.slug === slug);
      setCategory(cat || null);
      if (cat && !cat.parent_id) {
        setSubcats(all.filter(c => c.parent_id === cat.id));
      } else {
        setSubcats([]);
      }
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [slug, page]);

  const hasMore = articles.length < total;

  const owner = useMemo(() => {
    const validCollaborators = articles
      .map((art) => art?.collaborators)
      .filter(Boolean)
      .filter((collab) => collab.id || collab.slug || collab.name);

    if (!validCollaborators.length) return null;

    const uniqueKeys = Array.from(
      new Set(
        validCollaborators.map(
          (collab) => collab.id || collab.slug || collab.name
        )
      )
    );

    if (uniqueKeys.length !== 1) return null;

    const collaborator = validCollaborators[0];

return {
  slug: collaborator.slug || null,
  id: collaborator.id || null,
  name: collaborator.name || 'Autor/a de la sección',
  role:
    collaborator.role ||
    collaborator.section_role ||
    collaborator.position ||
    'Autor/a de la sección',
  photo:
    collaborator.photo_url ||
    collaborator.avatar_url ||
    collaborator.image_url ||
    collaborator.profile_photo_url ||
    null,
  bio:
    collaborator.bio ||
    collaborator.description ||
    collaborator.excerpt ||
    '',
  socials: {
    instagram:
      collaborator.instagram ||
      collaborator.instagram_url ||
      collaborator.social_instagram ||
      collaborator.social_links?.instagram ||
      collaborator.social_links?.instagram_url ||
      null,
    website:
      collaborator.website ||
      collaborator.website_url ||
      collaborator.portfolio_url ||
      collaborator.social_links?.website ||
      collaborator.social_links?.portfolio ||
      collaborator.social_links?.portfolio_url ||
      null,
    email: collaborator.email ? `mailto:${collaborator.email}` : null,
  },
};
  }, [articles]);
  return (
    <div className={styles.page}>

      {/* ── Header ────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.back}>
            <ArrowLeft size={13} /> Inicio
          </Link>

          {category ? (
            <>
              <div className={styles.headerLabel}>Sección</div>

              <div className={styles.headerTopRow}>
                <div className={styles.headerTitleCol}>
                  <h1 className={styles.headerTitle}>{category.name}</h1>
                  {category.description && (
                    <p className={styles.headerDesc}>{category.description}</p>
                  )}
                </div>

                {owner && (
                  <div className={styles.ownerInline}>
{owner.slug ? (
  <Link
    to={`/colaborador/${owner.slug}`}
    className={styles.ownerLink}
  >
    <div className={styles.ownerMedia}>
      {owner.photo ? (
        <img
          src={owner.photo}
          alt={owner.name}
          className={styles.ownerPhoto}
        />
      ) : (
        <div className={styles.ownerPhotoPlaceholder}>
          {(owner.name || '?')[0].toUpperCase()}
        </div>
      )}
    </div>
  </Link>
) : (
  <div className={styles.ownerMedia}>
    {owner.photo ? (
      <img
        src={owner.photo}
        alt={owner.name}
        className={styles.ownerPhoto}
      />
    ) : (
      <div className={styles.ownerPhotoPlaceholder}>
        {(owner.name || '?')[0].toUpperCase()}
      </div>
    )}
  </div>
)}

<div className={styles.ownerContent}>
  <div className={styles.ownerKicker}>Autora fija de la sección</div>

{owner.slug ? (
  <Link
    to={`/colaborador/${owner.slug}`}
    className={styles.ownerNameLink}
  >
    <h2 className={styles.ownerName}>{owner.name}</h2>
  </Link>
) : (
  <h2 className={styles.ownerName}>{owner.name}</h2>
)}

                      {owner.role && (
                        <div className={styles.ownerRole}>{owner.role}</div>
                      )}

                      {owner.bio && owner.bio.trim() && (
                        <p className={styles.ownerBio}>{owner.bio}</p>
                      )}

                      {(owner.socials?.instagram ||
                        owner.socials?.website ||
                        owner.socials?.email) && (
                        <div className={styles.ownerSocials}>
                          {owner.socials?.instagram && (
                            <a
                              href={owner.socials.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.ownerSocial}
                              aria-label="Instagram"
                            >
                              <InstagramIcon className={styles.ownerSocialIcon} />
                            </a>
                          )}

                          {owner.socials?.website && (
                            <a
                              href={owner.socials.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.ownerSocial}
                              aria-label="Sitio web"
                            >
                              <Globe size={16} className={styles.ownerSocialIcon} />
                            </a>
                          )}

                          {owner.socials?.email && (
                            <a
                              href={owner.socials.email}
                              className={styles.ownerSocial}
                              aria-label="Correo"
                            >
                              <Mail size={16} className={styles.ownerSocialIcon} />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <h1 className={styles.headerTitle}>{slug}</h1>
          )}

          {/* Subcategorías */}
          {subcats.length > 0 && (
            <div className={styles.subcats}>
              {subcats.map(sub => (
                <Link key={sub.id} to={`/categoria/${sub.slug}`} className={styles.subcatLink}>
                  {sub.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.meander} />

      {/* ── Contenido ─────────────────────────────────────── */}
      <div className={styles.body}>

        {loading && page === 1 ? (
          <GridSkeleton />
        ) : articles.length === 0 ? (
          <EmptyState name={category?.name || slug} />
        ) : (
          <>
            <div className={styles.grid}>
              {articles.map((art, i) => (
                <motion.div
                  key={art.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 5) * 0.06 }}
                >
                  <ArticleCard article={art} />
                </motion.div>
              ))}
            </div>

            {hasMore && (
              <div className={styles.loadMore}>
                <button
                  className={styles.loadMoreBtn}
                  onClick={() => setPage(p => p + 1)}
                  disabled={loading}
                >
                  {loading ? 'Cargando...' : 'Cargar más artículos'}
                </button>
                <div className={styles.loadMoreCount}>
                  {articles.length} de {total} artículos
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5Zm8.88 2.12a1.12 1.12 0 1 1 0 2.25 1.12 1.12 0 0 1 0-2.25ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Z" />
    </svg>
  );
}
function ArticleCard({ article: art }) {
  const cats = art.article_categories?.map(ac => ac.categories).filter(Boolean) || [];
  return (
    <Link to={`/articulos/${art.slug}`} className={styles.card}>
      <div className={styles.cardImg}>
        {art.cover_image_url
          ? <img src={art.cover_image_url} alt={art.title} />
          : <div className={styles.cardImgPlaceholder}><span>Λ</span></div>
        }
        {art.is_featured && <span className={styles.featuredBadge}>Destacado</span>}
      </div>
      <div className={styles.cardBody}>
        {cats.length > 0 && (
          <div className={styles.cardCats}>
            {cats.slice(0,2).map(c => (
              <span key={c.id} className={styles.cardCat}>{c.name}</span>
            ))}
          </div>
        )}
        <h3 className={styles.cardTitle}>{art.title}</h3>
        {art.subtitle && <p className={styles.cardSubtitle}>{art.subtitle}</p>}
        {art.excerpt  && <p className={styles.cardExcerpt}>{art.excerpt}</p>}
        <div className={styles.cardMeta}>
          {art.collaborators && (
            <span className={styles.cardAuthor}>{art.collaborators.name}</span>
          )}
          <span className={styles.dot}>·</span>
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
  );
}

function GridSkeleton() {
  return (
    <div className={styles.grid}>
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className={styles.skeletonCard} />
      ))}
    </div>
  );
}

function EmptyState({ name }) {
  return (
    <div className={styles.empty}>
      <span className={styles.emptySymbol}>Λ</span>
      <h3>No hay artículos en {name} todavía</h3>
      <p>Vuelve pronto, estamos trabajando en nuevo contenido.</p>
      <Link to="/" className={styles.emptyLink}>← Volver al inicio</Link>
    </div>
  );
}
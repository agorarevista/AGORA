import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getByCategory as getArticlesByCategory } from '../../api/articles.api';
import { getCategories } from '../../api/categories.api';
import {
  ArrowLeft,
  Globe,
  Mail,
  ExternalLink,
} from 'lucide-react';
import styles from './CategoryPage.module.css';
function flattenCategories(categoryTree = []) {
  if (!Array.isArray(categoryTree)) {
    return [];
  }

  return categoryTree.flatMap(parent => {
    const children = Array.isArray(parent.subcategories)
      ? parent.subcategories
      : [];

    return [
      parent,
      ...children,
    ];
  });
}
export default function CategoryPage() {
  const { slug } = useParams();
  const [articles, setArticles] = useState([]);
  const [category, setCategory] = useState(null);
  const [subcats, setSubcats]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const LIMIT = 15;

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
const tree = Array.isArray(cats)
  ? cats
  : [];

const allCategories = flattenCategories(tree);

const currentCategory = allCategories.find(
  item => item.slug === slug
);

setCategory(currentCategory || null);

if (currentCategory && !currentCategory.parent_id) {
  const children = Array.isArray(
    currentCategory.subcategories
  )
    ? currentCategory.subcategories
    : allCategories.filter(
        item => item.parent_id === currentCategory.id
      );

  setSubcats(children);
} else {
  setSubcats([]);
}
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [slug, page]);

  const hasMore = articles.length < total;
const owner = useMemo(() => {
  const collaborator = category?.fixed_collaborator;

  if (!collaborator || collaborator.is_active === false) {
    return null;
  }

  const socialLinks = collaborator.social_links || {};

  return {
    id: collaborator.id || null,
    slug: collaborator.slug || null,

    name:
      collaborator.name ||
      'Autor/a de la sección',

    photo:
      collaborator.photo_url ||
      null,

    bio:
      collaborator.bio ||
      '',

    socials: {
      instagram:
        socialLinks.instagram ||
        socialLinks.instagram_url ||
        null,

      facebook:
        socialLinks.facebook ||
        socialLinks.facebook_url ||
        null,

      x:
        socialLinks.x ||
        socialLinks.twitter ||
        socialLinks.twitter_url ||
        null,

      tiktok:
        socialLinks.tiktok ||
        socialLinks.tiktok_url ||
        null,

      youtube:
        socialLinks.youtube ||
        socialLinks.youtube_url ||
        null,

      website:
        socialLinks.website ||
        socialLinks.portfolio ||
        socialLinks.extra_link ||
        null,

      email:
        collaborator.email
          ? `mailto:${collaborator.email}`
          : null,
    },
  };
}, [category]);

const sectionCollaborators = useMemo(() => {
  /*
   * Si la categoría tiene autor fijo, no mostramos collage.
   */
  if (owner) {
    return [];
  }

  const collaboratorMap = new Map();

  articles.forEach(article => {
    const collaborator = article?.collaborators;

    if (
      !collaborator ||
      collaborator.is_active === false
    ) {
      return;
    }

    const collaboratorKey =
      collaborator.id ||
      collaborator.slug ||
      collaborator.name;

    if (!collaboratorKey) {
      return;
    }

    const socialLinks =
      collaborator.social_links || {};

    if (!collaboratorMap.has(collaboratorKey)) {
      collaboratorMap.set(collaboratorKey, {
        id:
          collaborator.id ||
          collaboratorKey,

        slug:
          collaborator.slug ||
          null,

        name:
          collaborator.name ||
          'Colaborador/a',

        photo:
          collaborator.photo_url ||
          collaborator.avatar_url ||
          collaborator.image_url ||
          null,

        socials: {
          instagram:
            socialLinks.instagram ||
            socialLinks.instagram_url ||
            collaborator.instagram ||
            collaborator.instagram_url ||
            null,

          facebook:
            socialLinks.facebook ||
            socialLinks.facebook_url ||
            collaborator.facebook ||
            collaborator.facebook_url ||
            null,

          x:
            socialLinks.x ||
            socialLinks.twitter ||
            socialLinks.twitter_url ||
            collaborator.x ||
            collaborator.twitter ||
            collaborator.twitter_url ||
            null,

          tiktok:
            socialLinks.tiktok ||
            socialLinks.tiktok_url ||
            collaborator.tiktok ||
            collaborator.tiktok_url ||
            null,

          youtube:
            socialLinks.youtube ||
            socialLinks.youtube_url ||
            collaborator.youtube ||
            collaborator.youtube_url ||
            null,

          website:
            socialLinks.website ||
            socialLinks.portfolio ||
            socialLinks.extra_link ||
            collaborator.website ||
            collaborator.website_url ||
            null,

          email:
            collaborator.email
              ? `mailto:${collaborator.email}`
              : null,
        },

        articlesCount: 1,
      });

      return;
    }

    const currentCollaborator =
      collaboratorMap.get(collaboratorKey);

    collaboratorMap.set(collaboratorKey, {
      ...currentCollaborator,
      articlesCount:
        currentCollaborator.articlesCount + 1,
    });
  });

  return Array.from(collaboratorMap.values());
}, [articles, owner]);

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
  <aside className={styles.ownerPanel}>
    <div className={styles.ownerPanelLabel}>
      Autor de la columna
    </div>

    <div className={styles.ownerPanelMain}>
      {owner.slug ? (
        <Link
          to={`/colaborador/${owner.slug}`}
          className={styles.ownerPhotoLink}
          aria-label={`Ver perfil de ${owner.name}`}
        >
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
        </Link>
      ) : (
        <>
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
        </>
      )}

      <div className={styles.ownerPanelInfo}>
        {owner.slug ? (
          <Link
            to={`/colaborador/${owner.slug}`}
            className={styles.ownerNameLink}
          >
            <h2 className={styles.ownerName}>
              {owner.name}
            </h2>
          </Link>
        ) : (
          <h2 className={styles.ownerName}>
            {owner.name}
          </h2>
        )}

        <div className={styles.ownerArticleCount}>
          <strong>{total}</strong>

          <span>
            {total === 1
              ? 'artículo publicado'
              : 'artículos publicados'}
          </span>
        </div>
      </div>
    </div>

    <div className={styles.ownerSocials}>
      {owner.socials.instagram && (
        <a
          href={owner.socials.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ownerSocial}
          aria-label="Instagram"
          title="Instagram"
        >
          <InstagramIcon
            className={styles.ownerSocialIcon}
          />
        </a>
      )}

      {owner.socials.facebook && (
        <a
          href={owner.socials.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ownerSocial}
          aria-label="Facebook"
          title="Facebook"
        >
          <FacebookIcon
            className={styles.ownerSocialIcon}
          />
        </a>
      )}

      {owner.socials.x && (
        <a
          href={owner.socials.x}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ownerSocial}
          aria-label="X"
          title="X"
        >
          <XIcon
            className={styles.ownerSocialIcon}
          />
        </a>
      )}

      {owner.socials.tiktok && (
        <a
          href={owner.socials.tiktok}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ownerSocial}
          aria-label="TikTok"
          title="TikTok"
        >
          <TikTokIcon
            className={styles.ownerSocialIcon}
          />
        </a>
      )}

      {owner.socials.youtube && (
        <a
          href={owner.socials.youtube}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ownerSocial}
          aria-label="YouTube"
          title="YouTube"
        >
          <YouTubeIcon
            className={styles.ownerSocialIcon}
          />
        </a>
      )}

      {owner.socials.website && (
        <a
          href={owner.socials.website}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ownerSocial}
          aria-label="Sitio web"
          title="Sitio web"
        >
          <Globe
            size={16}
            className={styles.ownerSocialIcon}
          />
        </a>
      )}

      {owner.socials.email && (
        <a
          href={owner.socials.email}
          className={styles.ownerSocial}
          aria-label="Correo"
          title="Correo"
        >
          <Mail
            size={16}
            className={styles.ownerSocialIcon}
          />
        </a>
      )}

      {owner.slug && (
        <Link
          to={`/colaborador/${owner.slug}`}
          className={`${styles.ownerSocial} ${styles.ownerProfileButton}`}
          aria-label={`Abrir perfil de ${owner.name}`}
          title="Ver perfil"
        >
          <ExternalLink
            size={15}
            className={styles.ownerSocialIcon}
          />
        </Link>
      )}
    </div>
  </aside>
)}

{!owner && sectionCollaborators.length > 0 && (
  <AuthorsCollage
    collaborators={sectionCollaborators}
  />
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

function AuthorsCollage({ collaborators }) {
  const visibleCollaborators =
    collaborators.slice(0, 10);

  return (
    <aside className={styles.authorsPanel}>
      <div className={styles.authorsPanelHeader}>
        <div>
          <span className={styles.authorsPanelEyebrow}>
            Voces de la sección
          </span>

          <h2 className={styles.authorsPanelTitle}>
            Colaboradores
          </h2>
        </div>

        <span className={styles.authorsPanelCount}>
          {collaborators.length}
        </span>
      </div>

      <div className={styles.authorsCollage}>
        {visibleCollaborators.map(collaborator => (
          <article
            key={collaborator.id}
            className={styles.authorPortrait}
          >
            {collaborator.slug ? (
              <Link
                to={`/colaborador/${collaborator.slug}`}
                className={styles.authorPortraitLink}
                aria-label={`Ver perfil de ${collaborator.name}`}
              >
                <AuthorPortraitImage
                  collaborator={collaborator}
                />
              </Link>
            ) : (
              <AuthorPortraitImage
                collaborator={collaborator}
              />
            )}

            <div className={styles.authorPortraitOverlay}>
              {collaborator.slug ? (
                <Link
                  to={`/colaborador/${collaborator.slug}`}
                  className={styles.authorPortraitName}
                >
                  {collaborator.name}
                </Link>
              ) : (
                <span className={styles.authorPortraitName}>
                  {collaborator.name}
                </span>
              )}

              <div className={styles.authorPortraitSocials}>
                {collaborator.socials.instagram && (
                  <a
                    href={collaborator.socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.authorPortraitSocial}
                    aria-label={`Instagram de ${collaborator.name}`}
                    title="Instagram"
                  >
                    <InstagramIcon />
                  </a>
                )}

                {collaborator.socials.facebook && (
                  <a
                    href={collaborator.socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.authorPortraitSocial}
                    aria-label={`Facebook de ${collaborator.name}`}
                    title="Facebook"
                  >
                    <FacebookIcon />
                  </a>
                )}

                {collaborator.socials.x && (
                  <a
                    href={collaborator.socials.x}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.authorPortraitSocial}
                    aria-label={`X de ${collaborator.name}`}
                    title="X"
                  >
                    <XIcon />
                  </a>
                )}

                {collaborator.socials.tiktok && (
                  <a
                    href={collaborator.socials.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.authorPortraitSocial}
                    aria-label={`TikTok de ${collaborator.name}`}
                    title="TikTok"
                  >
                    <TikTokIcon />
                  </a>
                )}

                {collaborator.socials.youtube && (
                  <a
                    href={collaborator.socials.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.authorPortraitSocial}
                    aria-label={`YouTube de ${collaborator.name}`}
                    title="YouTube"
                  >
                    <YouTubeIcon />
                  </a>
                )}

                {collaborator.socials.website && (
                  <a
                    href={collaborator.socials.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.authorPortraitSocial}
                    aria-label={`Sitio de ${collaborator.name}`}
                    title="Sitio web"
                  >
                    <Globe size={14} />
                  </a>
                )}

                {collaborator.socials.email && (
                  <a
                    href={collaborator.socials.email}
                    className={styles.authorPortraitSocial}
                    aria-label={`Correo de ${collaborator.name}`}
                    title="Correo"
                  >
                    <Mail size={14} />
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}

        {collaborators.length > 10 && (
          <div className={styles.authorsMore}>
            <strong>
              +{collaborators.length - 10}
            </strong>

            <span>
              colaboradores
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}

function AuthorPortraitImage({ collaborator }) {
  if (collaborator.photo) {
    return (
      <img
        src={collaborator.photo}
        alt={collaborator.name}
        className={styles.authorPortraitImage}
      />
    );
  }

  return (
    <div className={styles.authorPortraitPlaceholder}>
      {(collaborator.name || '?')[0].toUpperCase()}
    </div>
  );
}

function InstagramIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5Zm8.88 2.12a1.12 1.12 0 1 1 0 2.25 1.12 1.12 0 0 1 0-2.25ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Z" />
    </svg>
  );
}

function FacebookIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M13.5 22v-8.2h2.77l.42-3.22H13.5V8.5c0-.93.26-1.56 1.6-1.56h1.71V4.06c-.3-.04-1.3-.12-2.47-.12-2.44 0-4.11 1.49-4.11 4.22v2.4H7.97v3.22h2.26V22h3.27Z" />
    </svg>
  );
}

function XIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M18.9 2H21l-6.56 7.5L22.16 22h-6.04l-4.73-6.2L5.96 22H3.84l7.01-8.01L2 2h6.2l4.27 5.64L18.9 2Zm-1.06 18.2h1.68L7.3 3.7H5.5l12.34 16.5Z" />
    </svg>
  );
}

function TikTokIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M16.6 3c.35 2.02 1.52 3.22 3.4 3.35v3.03a7.5 7.5 0 0 1-3.38-.85v6.31a6.12 6.12 0 1 1-5.28-6.06v3.1a3.09 3.09 0 1 0 2.2 2.96V3h3.06Z" />
    </svg>
  );
}

function YouTubeIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M21.58 7.19a2.98 2.98 0 0 0-2.1-2.11C17.62 4.58 12 4.58 12 4.58s-5.62 0-7.48.5a2.98 2.98 0 0 0-2.1 2.11A31.1 31.1 0 0 0 1.92 12c0 1.61.17 3.22.5 4.81a2.98 2.98 0 0 0 2.1 2.11c1.86.5 7.48.5 7.48.5s5.62 0 7.48-.5a2.98 2.98 0 0 0 2.1-2.11c.33-1.59.5-3.2.5-4.81s-.17-3.22-.5-4.81ZM9.98 15.2V8.8L15.5 12l-5.52 3.2Z" />
    </svg>
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
    elapsedMilliseconds / (1000 * 60 * 60 * 24);

  return elapsedDays >= 0 && elapsedDays <= 10;
}

function ArticleCard({ article }) {
  const authorName =
    article.collaborators?.name ||
    article.author_name ||
    'Agorá Revista';

  const publishedDate =
    formatArticleDate(article.published_at);

  const isNew =
    isRecentArticle(article.published_at);

  return (
    <Link
      to={`/articulos/${article.slug}`}
      className={styles.card}
    >
      <div className={styles.cardImg}>
        {article.cover_image_url ? (
          <img
            src={article.cover_image_url}
            alt={article.title}
          />
        ) : (
          <div className={styles.cardImgPlaceholder}>
            <span>Λ</span>
          </div>
        )}

        {isNew && (
          <span className={styles.newBadge}>
            <span className={styles.newBadgeText}>
              New
            </span>

            <span
              className={styles.newBadgeDot}
              aria-hidden="true"
            />
          </span>
        )}

        <div className={styles.cardOverlay}>
          <div className={styles.cardText}>
            <h3 className={styles.cardTitle}>
              {article.title}
            </h3>

            <p className={styles.cardAuthor}>
              {authorName}
            </p>

            {publishedDate && (
              <time
                className={styles.cardDate}
                dateTime={article.published_at}
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

function GridSkeleton() {
  return (
    <div className={styles.grid}>
      {[1, 2, 3, 4, 5].map(item => (
        <div
          key={item}
          className={styles.skeletonCard}
        />
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
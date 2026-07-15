import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  motion,
  AnimatePresence,
} from 'framer-motion';
import {
  getEdition as getEditionByNumber,
} from '../../api/editions.api';
import {
  getGalleriesByEdition,
} from '../../api/galleries.api';
import { formatDate } from '../../utils/formatDate';
import {
  BookOpen,
  ArrowLeft,
} from 'lucide-react';

import ImageViewer from '../../components/common/ImageViewer/ImageViewer';
import styles from './EditionPage.module.css';

export default function EditionPage() {
  const { number } = useParams();

  const [edition, setEdition] = useState(null);
  const [
    contents,
    setContents,
  ] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [viewer, setViewer] = useState(null);

useEffect(() => {
  let mounted = true;

  const loadEdition = async () => {
    setLoading(true);
    setError(false);

    try {
      const editionData = await getEditionByNumber(number);

      if (!mounted) return;

      setEdition(editionData);
      const editionArticles =
        Array.isArray(
          editionData
            ?.articles
        )
          ? editionData
              .articles
              .map(
                article => ({
                  ...article,

                  content_type:
                    'article',
                })
              )
          : [];

      let editionGalleries =
        [];

      try {
        const galleriesResult =
          await getGalleriesByEdition(
            number,
            {
              limit: 100,
            }
          );

        editionGalleries =
          Array.isArray(
            galleriesResult
              ?.data
          )
            ? galleriesResult
                .data
                .map(
                  gallery => ({
                    ...gallery,

                    content_type:
                      'gallery',
                  })
                )
            : [];
      } catch (
        galleryError
      ) {
        console.error(
          'ERROR cargando galerías de la edición:',
          galleryError
        );
      }

      const mergedContents = [
        ...editionArticles,
        ...editionGalleries,
      ].sort(
        (a, b) => {
          const dateA =
            new Date(
              a.published_at ||
              a.created_at ||
              0
            ).getTime();

          const dateB =
            new Date(
              b.published_at ||
              b.created_at ||
              0
            ).getTime();

          return (
            dateB -
            dateA
          );
        }
      );

      setContents(
        mergedContents
      );
    } catch (err) {
      console.error(
        'ERROR cargando edición:',
        err?.response?.status,
        err?.response?.data || err
      );

      if (mounted) {
        setError(true);
        setEdition(null);
        setContents([]);
      }
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  };

  loadEdition();

  return () => {
    mounted = false;
  };
}, [number]);

const handleOpenCover = () => {
  if (!edition?.cover_image_url) return;

  setViewer({
    src: edition.cover_image_url,
    alt:
      edition.name ||
      `Edición ${edition.number}`,
  });
};

if (loading) return <EditionSkeleton />;
if (error || !edition) return <NotFound />;

  return (
    <div className={styles.page}>
      {/* ── CABECERA DE LA EDICIÓN ─────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <Link to="/ediciones" className={styles.back}>
            <ArrowLeft size={14} />
            Volver a ediciones
          </Link>

          <motion.div
            className={styles.heroContent}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className={styles.heroBadges}>
              <span className={styles.editionBadge}>
                Edición #{edition.number}
              </span>

              {edition.is_special && (
                <span className={styles.specialBadge}>
                  Edición especial
                </span>
              )}

              {edition.is_current && (
                <span className={styles.currentBadge}>
                  Edición actual
                </span>
              )}
            </div>

            <h1 className={styles.heroTitle}>
              {edition.name}
            </h1>

<div className={styles.coverWrap}>
  {edition.cover_image_url ? (
<button
  type="button"
  className={styles.coverButton}
  onClick={handleOpenCover}
  aria-label={`Abrir portada de ${edition.name}`}
>
  <img
    src={edition.cover_image_url}
    alt={edition.name}
    className={styles.cover}
  />
</button>
  ) : (
    <div className={styles.coverPlaceholder}>
      <BookOpen size={48} />
      <span>Edición #{edition.number}</span>
    </div>
  )}
</div>

            {edition.description && (
              <p className={styles.heroDesc}>
                {edition.description}
              </p>
            )}

            <div className={styles.heroMeta}>
              {edition.published_at && (
                <span>
                  Publicada el {formatDate(edition.published_at)}
                </span>
              )}
              {edition.published_at && contents.length > 0 && (
                <span className={styles.metaDot}>·</span>
              )}

              {contents.length > 0 && (
                <span>
                  {contents.length}{' '}
                  {contents.length ===
                  1
                    ? 'publicación'
                    : 'publicaciones'}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <div className={styles.meander} />

      {/* ── TODOS LOS ARTÍCULOS ───────────────────────── */}
      <main className={styles.body}>
        {contents.length > 0 ? (
          <section className={styles.articlesSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionEyebrow}>
                Explora la edición
              </span>

              <h2 className={styles.sectionTitle}>
                Todo el contenido
              </h2>
            </div>

            <div className={styles.articlesGrid}>
              {contents.map((content, index) => (
                <motion.div
                  key={`${content.content_type}-${content.id}`}
                  className={styles.articleCardWrapper}
                  initial={{
                    opacity: 0,
                    y: 18,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                    amount: 0.15,
                  }}
                  transition={{
                    duration: 0.35,
                    delay:
                      Math.min(
                        index % 5,
                        4
                      ) * 0.05,
                  }}
                >
                  <EditionContentCard
                    content={content}
                  />
                </motion.div>
              ))}
            </div>
          </section>
        ) : (
          <div className={styles.empty}>
            <BookOpen size={38} />
            <p>
              Esta edición no tiene contenido publicado todavía.
            </p>
          </div>
        )}
      </main>

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

function EditionContentCard({
  content,
}) {
  const categories =
    content.content_type ===
    'gallery'
      ? [
          'Álbum fotográfico',
        ]
      : getArticleCategories(
          content
        );

  const authorName =
    content.collaborators
      ?.name ||
    content.author_name ||
    'Redacción Agorá';

  const contentPath =
    content.content_type ===
    'gallery'
      ? `/galerias/${content.slug}`
      : `/articulos/${content.slug}`;

  return (
    <Link
      to={contentPath}
      className={
        styles.articleCard
      }
    >
      <div
        className={
          styles.articleCardImage
        }
      >
        {content.cover_image_url ? (
          <img
            src={
              content
                .cover_image_url
            }
            alt={
              content.title
            }
          />
        ) : (
          <div
            className={
              styles.imgPlaceholder
            }
          >
            <span>Λ</span>
          </div>
        )}

        <div
          className={
            styles.articleCardOverlay
          }
        >
          {categories.length >
            0 && (
            <div
              className={
                styles.articleCategories
              }
            >
              {categories.map(
                category => (
                  <span
                    key={
                      category
                    }
                    className={
                      styles.articleCategory
                    }
                  >
                    {category}
                  </span>
                )
              )}
            </div>
          )}

          <div
            className={
              styles.articleCardText
            }
          >
            <h3
              className={
                styles.articleCardTitle
              }
            >
              {content.title}
            </h3>

            <p
              className={
                styles.articleCardAuthor
              }
            >
              {authorName}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function getArticleCategories(article) {
  const pivotCategories = Array.isArray(article.article_categories)
    ? article.article_categories
        .map(item => item?.categories?.name)
        .filter(Boolean)
    : [];

  const directCategories = Array.isArray(article.categories)
    ? article.categories
        .map(category => category?.name || category)
        .filter(Boolean)
    : [];

  return [...new Set([
    ...pivotCategories,
    ...directCategories,
  ])].slice(0, 2);
}

function EditionSkeleton() {
  return (
    <div className={styles.skeletonPage}>
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonCover} />
        <div className={styles.skeletonDescription} />
      </div>

      <div className={styles.skeletonGrid}>
        {[1, 2, 3, 4, 5].map(item => (
          <div
            key={item}
            className={styles.skeletonCard}
          />
        ))}
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className={styles.notFound}>
      <div className={styles.notFoundSymbol}>
        Λ
      </div>

      <h2 className={styles.notFoundTitle}>
        Edición no encontrada
      </h2>

      <Link
        to="/ediciones"
        className={styles.notFoundLink}
      >
        Volver a ediciones
      </Link>
    </div>
  );
}
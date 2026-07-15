import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getEditions } from '../../api/editions.api';
import {
  getGalleriesByEdition,
} from '../../api/galleries.api';
import ImageViewer from '../../components/common/ImageViewer/ImageViewer';
import styles from './ArchivoPage.module.css';

export default function ArchivoPage() {
  const [
    contents,
    setContents,
  ] = useState([]);
  const [edition, setEdition]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [viewer, setViewer]     = useState(null);
  useEffect(() => {
    let mounted = true;

    const load =
      async () => {
        try {
          const editions =
            await getEditions();

          if (!mounted) {
            return;
          }

          const current =
            (
              editions ||
              []
            ).find(
              item =>
                item.is_current
            );

          setEdition(
            current ||
            null
          );

          if (
            !current
              ?.number
          ) {
            setContents([]);
            return;
          }

          const [
            articlesResult,
            galleriesResult,
          ] = await Promise.allSettled([
            getByEdition(
              current.number,
              {
                limit: 100,
              }
            ),

            getGalleriesByEdition(
              current.number,
              {
                limit: 100,
              }
            ),
          ]);

          if (!mounted) {
            return;
          }

          const articleContents =
            articlesResult.status ===
              'fulfilled'
              ? (
                  articlesResult
                    .value
                    ?.data ||
                  []
                ).map(
                  article => ({
                    ...article,

                    content_type:
                      'article',
                  })
                )
              : [];

          const galleryContents =
            galleriesResult.status ===
              'fulfilled'
              ? (
                  galleriesResult
                    .value
                    ?.data ||
                  []
                ).map(
                  gallery => ({
                    ...gallery,

                    content_type:
                      'gallery',
                  })
                )
              : [];

          const mergedContents = [
            ...articleContents,
            ...galleryContents,
          ]
            .filter(
              item =>
                item
                  .cover_image_url
            )
            .sort(
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
        } catch (error) {
          console.error(
            'Error cargando archivo visual:',
            error
          );

          if (mounted) {
            setContents([]);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>{edition ? `Edición № ${edition.number}` : 'Edición actual'}</span>
          <h1 className={styles.title}>Archivo visual</h1>
          {edition && <p className={styles.sub}>Galería de portadas — {edition.name}</p>}
        </div>
      </div>
      <div className={styles.meander} />
      <div className={styles.body}>
        {loading ? (
          <div className={styles.grid}>
            {[1,2,3,4,5,6,8,9,10].map(i => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : contents.length === 0 ? (
          <div className={styles.empty}>
            <p>{edition ? 'No hay imágenes en esta edición' : 'No hay edición activa'}</p>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {contents.map((art, i) => (
                <motion.button
                  key={`${art.content_type}-${art.id}`}
                  className={styles.item}
                  onClick={() => setViewer({ src: art.cover_image_url, alt: art.title })}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(i, 12) * 0.04 }}
                >
                  <img src={art.cover_image_url} alt={art.title} />
                  <div className={styles.overlay}>
                    {art.content_type ===
                      'gallery' && (
                      <span
                        className={
                          styles.overlayType
                        }
                      >
                        Álbum fotográfico
                      </span>
                    )}

                    <span
                      className={
                        styles.overlayTitle
                      }
                    >
                      {art.title}
                    </span>
                    {art.collaborators && <span className={styles.overlayAuthor}>{art.collaborators.name}</span>}
                  </div>
                </motion.button>
              ))}
            </div>
            {edition && (
              <div className={styles.footer}>
                <Link to={`/edicion/${edition.number}`} className={styles.footerLink}>
                  Ver todo el contenido de esta edición →
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {viewer && (
          <ImageViewer src={viewer.src} alt={viewer.alt || ''} onClose={() => setViewer(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
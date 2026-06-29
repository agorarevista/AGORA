import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getEditions } from '../../api/editions.api';
import { getByEdition } from '../../api/articles.api';
import ImageViewer from '../../components/common/ImageViewer/ImageViewer';
import styles from './ArchivoPage.module.css';

export default function ArchivoPage() {
  const [articles, setArticles] = useState([]);
  const [edition, setEdition]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [viewer, setViewer]     = useState(null);

  useEffect(() => {
    getEditions().then(eds => {
      const current = (eds || []).find(e => e.is_current);
      setEdition(current || null);
      if (current?.number) {
        getByEdition(current.number, { limit: 50 })
          .then(res => setArticles((res.data || []).filter(a => a.cover_image_url)))
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));
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
        ) : articles.length === 0 ? (
          <div className={styles.empty}>
            <p>{edition ? 'No hay imágenes en esta edición' : 'No hay edición activa'}</p>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {articles.map((art, i) => (
                <motion.button
                  key={art.id}
                  className={styles.item}
                  onClick={() => setViewer({ src: art.cover_image_url, alt: art.title })}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(i, 12) * 0.04 }}
                >
                  <img src={art.cover_image_url} alt={art.title} />
                  <div className={styles.overlay}>
                    <span className={styles.overlayTitle}>{art.title}</span>
                    {art.collaborators && <span className={styles.overlayAuthor}>{art.collaborators.name}</span>}
                  </div>
                </motion.button>
              ))}
            </div>
            {edition && (
              <div className={styles.footer}>
                <Link to={`/edicion/${edition.number}`} className={styles.footerLink}>
                  Ver todos los artículos de esta edición →
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
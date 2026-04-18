import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { registerShare, getShares } from '../../../api/shares.api';
import useAlertStore from '../../../store/alertStore';
import styles from './ShareButtons.module.css';
const PLATFORMS = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    color: '#25D366',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.562 4.117 1.535 5.845L.057 23.215a.75.75 0 0 0 .94.94l5.324-1.485A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.91 0-3.7-.515-5.23-1.41l-.375-.22-3.882 1.084 1.09-3.978-.235-.38A9.961 9.961 0 0 1 2 12C2 6.478 6.478 2 12 2s10 4.478 10 10-4.478 10-10 10z"/>
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    color: '#1877F2',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    id: 'twitter',
    label: 'X / Twitter',
    color: '#000000',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    id: 'instagram',
    label: 'Instagram',
    color: '#E1306C',
    gradient: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    id: 'copy',
    label: 'Copiar enlace',
    color: '#6B6B6B',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    ),
  },
];

export default function ShareButtons({ article }) {
  const [open, setOpen]        = useState(false);
  const [copied, setCopied]    = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [shares, setShares]    = useState(0);
  const showAlert = useAlertStore((state) => state.showAlert);

  const url   = typeof window !== 'undefined' ? window.location.href : '';
  const title = article?.title || '';
  const loadShares = useCallback(async () => {
    try {
      const data = await getShares(article.id);
      setShares(data?.total || 0);
    } catch {
    }
  }, [article.id]);

  useEffect(() => {
    loadShares();

    const interval = setInterval(() => {
      loadShares();
    }, 2500);

    return () => clearInterval(interval);
  }, [loadShares]);

  const handleOpen = () => {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 500);
    setOpen(true);
  };

  const share = async (platform) => {
    registerShare(article.id, platform)
      .then(res => {
        if (typeof res?.total === 'number') setShares(res.total);
        else loadShares();
      })
      .catch(() => {});

    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' — ' + url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    };

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);

        showAlert({
          type: 'success',
          title: 'Enlace copiado',
          message: 'El enlace del artículo se copió al portapapeles.',
          duration: 3000,
        });
      } catch {
        showAlert({
          type: 'error',
          title: 'No se pudo copiar',
          message: 'No fue posible copiar el enlace al portapapeles.',
          duration: 3500,
        });
      }
      return;
    }

    if (platform === 'instagram') {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);

        showAlert({
          type: 'info',
          title: 'Instagram Stories',
          message: 'Instagram no permite abrir compartir a Stories desde web. Ya copiamos el enlace para que lo pegues manualmente en la app.',
          duration: 5000,
        });

        window.open('https://www.instagram.com/', '_blank');
      } catch {
        showAlert({
          type: 'info',
          title: 'Instagram Stories',
          message: 'Instagram no permite abrir compartir a Stories desde web.',
          duration: 4500,
        });
      }

      return;
    }

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=450');
    }
  };

  return (
    <>
      {/* Botón de compartir */}
      <button
        className={`${styles.shareBtn} ${spinning ? styles.spinning : ''}`}
        onClick={handleOpen}
        title="Compartir"
      >
        <span className={styles.shareIconWrap}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </span>
        <span className={styles.shareCount}>{shares}</span>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <div className={styles.modalViewport}>
              <motion.div
                className={styles.modal}
                initial={{ opacity: 0, scale: 0.92, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 12 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <div className={styles.modalHeader}>
                  <span className={styles.modalTitle}>Compartir artículo</span>
                  <button className={styles.modalClose} onClick={() => setOpen(false)}>✕</button>
                </div>

                {/* Preview del artículo */}
                {article?.cover_image_url && (
                  <div className={styles.preview}>
                    <img src={article.cover_image_url} alt="" className={styles.previewImg} />
                    <div className={styles.previewInfo}>
                      <span className={styles.previewSite}>agorarevista.com</span>
                      <span className={styles.previewTitle}>{article.title}</span>
                    </div>
                  </div>
                )}

                {/* Plataformas */}
                <div className={styles.platforms}>
                  {PLATFORMS.map(p => (
                    <button
                      key={p.id}
                      className={styles.platform}
                      onClick={() => share(p.id)}
                    >
                      <span
                        className={styles.platformIcon}
                        style={{
                          background: p.gradient || p.color,
                          color: 'white'
                        }}
                      >
                        {p.icon}
                      </span>
                      <span className={styles.platformLabel}>
                        {p.id === 'copy' && copied ? '¡Copiado!' : p.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* URL copiada */}
                {copied && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.copiedMsg}
                  >
                    Enlace copiado al portapapeles
                  </motion.div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
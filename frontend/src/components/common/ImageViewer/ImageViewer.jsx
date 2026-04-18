import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';
import styles from './ImageViewer.module.css';

export default function ImageViewer({ src, alt, onClose }) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleDownload = async () => {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = alt || 'imagen-agora';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(src, '_blank');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      >
        {/* Controles */}
        <motion.div
          className={styles.controls}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={e => e.stopPropagation()}
        >
          <button className={styles.ctrlBtn} onClick={() => setZoom(z => Math.min(z + 0.3, 4))} title="Zoom in">
            <ZoomIn size={18} />
          </button>
          <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
          <button className={styles.ctrlBtn} onClick={() => setZoom(z => Math.max(z - 0.3, 0.3))} title="Zoom out">
            <ZoomOut size={18} />
          </button>
          <button className={styles.ctrlBtn} onClick={() => setZoom(1)} title="Resetear">
            <RotateCcw size={18} />
          </button>
          <div className={styles.ctrlSep} />
          <button className={styles.ctrlBtn} onClick={handleDownload} title="Descargar">
            <Download size={18} />
          </button>
          <button className={`${styles.ctrlBtn} ${styles.closeBtn}`} onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </motion.div>

        {/* Imagen */}
        <motion.div
          className={styles.imgWrap}
          onClick={e => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <img
            src={src}
            alt={alt}
            className={styles.img}
            style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease' }}
            draggable={false}
          />
        </motion.div>

        {/* Hint */}
        <motion.div
          className={styles.hint}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Clic fuera para cerrar · Esc para salir
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
import { AnimatePresence, motion } from 'framer-motion';
import useConfirmStore from '../../../store/confirmStore';
import styles from './ConfirmDialog.module.css';

const TYPES = {
  warning: { icon: 'Δ', label: 'Δέλτα', color: '#B8860B', bg: '#FDF6E3', border: '#B8860B' },
  error:   { icon: 'Ω', label: 'Ὦ μέγα', color: '#8B1A1A', bg: '#FAE8E8', border: '#8B1A1A' },
  info:    { icon: 'Λ', label: 'Ἀγορά',  color: '#1A3A6B', bg: '#E8EEF8', border: '#1A3A6B' },
  success: { icon: 'Ν', label: 'Νίκη',   color: '#2D7A4F', bg: '#E8F5EE', border: '#2D7A4F' },
};

const MEANDER = '─┐└─┘┌─┐└─';

export default function ConfirmDialog() {
  const { confirm, hideConfirm } = useConfirmStore();

  const handleConfirm = () => {
    confirm?.onConfirm?.();
    hideConfirm();
  };

  const handleCancel = () => {
    confirm?.onCancel?.();
    hideConfirm();
  };

  return (
    <AnimatePresence>
      {confirm && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCancel}
        >
          <motion.div
            className={`${styles.dialog} ${styles[confirm.type]}`}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
          >
            {/* Franja superior con meandro */}
            <div className={styles.topBar} />

            {/* Cuerpo */}
            <div className={styles.body}>
              <div className={styles.iconWrap}>
                <span className={styles.icon}>
                  {TYPES[confirm.type]?.icon || 'Δ'}
                </span>
              </div>

              <div className={styles.content}>
                <div className={styles.typeLabel}>
                  {TYPES[confirm.type]?.label || 'Δέλτα'}
                </div>
                {confirm.title && (
                  <div className={styles.title}>{confirm.title}</div>
                )}
                {confirm.message && (
                  <div className={styles.message}>{confirm.message}</div>
                )}
              </div>
            </div>

            {/* Ornamento */}
            <div className={styles.meander}>{MEANDER}</div>

            {/* Acciones */}
            <div className={styles.actions}>
              <button className={styles.cancelBtn} onClick={handleCancel}>
                {confirm.cancelLabel || 'Cancelar'}
              </button>
              <button
                className={`${styles.confirmBtn} ${styles[`confirmBtn_${confirm.type}`]}`}
                onClick={handleConfirm}
              >
                {confirm.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
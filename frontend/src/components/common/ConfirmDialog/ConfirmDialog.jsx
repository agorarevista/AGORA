import { AnimatePresence, motion } from 'framer-motion';
import useConfirmStore from '../../../store/confirmStore';
import styles from './ConfirmDialog.module.css';

const TYPES = {
  warning: {
    icon: 'Δ',
    label: 'Δέλτα',
  },

  error: {
    icon: 'Ω',
    label: 'Ὦ μέγα',
  },

  info: {
    icon: 'Λ',
    label: 'Ἀγορά',
  },

  success: {
    icon: 'Ν',
    label: 'Νίκη',
  },
};

function normalizeConfirmType(type) {
  const normalizedType = String(type || '')
    .trim()
    .toLowerCase();

  if (
    normalizedType === 'danger' ||
    normalizedType === 'delete' ||
    normalizedType === 'destructive'
  ) {
    return 'error';
  }

  if (TYPES[normalizedType]) {
    return normalizedType;
  }

  return 'warning';
}

export default function ConfirmDialog() {
  const { confirm, hideConfirm } = useConfirmStore();

  const resolvedType = normalizeConfirmType(
    confirm?.type
  );

  const typeConfig =
    TYPES[resolvedType];

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
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          onClick={handleCancel}
        >
          <motion.div
            className={`
              ${styles.dialog}
              ${styles[resolvedType]}
            `}
            initial={{
              opacity: 0,
              scale: 0.94,
              y: 18,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.94,
              y: 18,
            }}
            transition={{
              duration: 0.22,
              ease: [0.16, 1, 0.3, 1],
            }}
            onClick={event =>
              event.stopPropagation()
            }
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
          >
            <div className={styles.topBar} />

            <div className={styles.body}>
              <div className={styles.iconWrap}>
                <span className={styles.icon}>
                  {typeConfig.icon}
                </span>
              </div>

              <div className={styles.content}>
                <div className={styles.typeLabel}>
                  {typeConfig.label}
                </div>

                {confirm.title && (
                  <div
                    id="confirm-dialog-title"
                    className={styles.title}
                  >
                    {confirm.title}
                  </div>
                )}

                {confirm.message && (
                  <div
                    id="confirm-dialog-message"
                    className={styles.message}
                  >
                    {confirm.message}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.meander}>
              <span />
              <span />
              <span />
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={handleCancel}
              >
                {confirm.cancelLabel || 'Cancelar'}
              </button>

              <button
                type="button"
                className={`
                  ${styles.confirmBtn}
                  ${styles[`confirmBtn_${resolvedType}`]}
                `}
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
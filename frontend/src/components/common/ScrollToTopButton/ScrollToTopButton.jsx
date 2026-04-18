import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import styles from './ScrollToTopButton.module.css';

function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

function smoothScrollToTop(duration = 520) {
  const start = window.scrollY || window.pageYOffset;
  if (start <= 0) return;

  const startTime = performance.now();

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutQuart(progress);
    const nextY = start * (1 - eased);

    window.scrollTo(0, nextY);

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

export default function ScrollToTopButton({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          aria-label="Volver arriba"
          title="Volver arriba"
          className={styles.btn}
          onClick={() => smoothScrollToTop(150)}
          initial={{ opacity: 0, y: 18, scale: 0.90 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.94 }}
          transition={{
            duration: 0.22,
            ease: [0.22, 1, 0.36, 1],
          }}
          whileHover={{ y: -2, scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <ChevronUp size={28} strokeWidth={3.2} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
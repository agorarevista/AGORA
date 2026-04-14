import { motion } from 'framer-motion';

const variants = {
  fadeUp: {
    initial:  { opacity: 0, y: 30 },
    animate:  { opacity: 1, y: 0 },
    exit:     { opacity: 0, y: -20 },
  },
  fadeRight: {
    initial:  { opacity: 0, x: -30 },
    animate:  { opacity: 1, x: 0 },
    exit:     { opacity: 0, x: 30 },
  },
  fadeIn: {
    initial:  { opacity: 0 },
    animate:  { opacity: 1 },
    exit:     { opacity: 0 },
  },
};

export default function PageTransition({
  children,
  variant = 'fadeUp',
  delay = 0
}) {
  const v = variants[variant];
  return (
    <motion.div
      initial={v.initial}
      animate={v.animate}
      exit={v.exit}
      transition={{ duration: 0.4, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}

// Componente para animar elementos individuales al aparecer en pantalla
export function FadeIn({ children, delay = 0, direction = 'up' }) {
  const dirs = {
    up:    { y: 24, x: 0 },
    down:  { y: -24, x: 0 },
    left:  { x: 24, y: 0 },
    right: { x: -24, y: 0 },
  };
  const d = dirs[direction] || dirs.up;

  return (
    <motion.div
      initial={{ opacity: 0, ...d }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}
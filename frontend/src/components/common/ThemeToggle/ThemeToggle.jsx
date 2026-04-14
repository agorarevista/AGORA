import { useEffect } from 'react';
import useThemeStore from '../../../store/themeStore';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const { theme, init, toggle } = useThemeStore();

  useEffect(() => { init(); }, []);

  const isDark = theme === 'dark';

  return (
    <button
      className={styles.btn}
      onClick={toggle}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {/* Track — muestra solo 1 ícono a la vez */}
      <div className={styles.track}>
        <div className={`${styles.slider} ${isDark ? styles.sliderDark : ''}`}>
          {/* Slot 1: Luna (arriba) */}
          <div className={styles.slot}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </div>
          {/* Slot 2: Sol (abajo) */}
          <div className={styles.slot}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          </div>
        </div>
      </div>
    </button>
  );
}
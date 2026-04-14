import { useEffect } from 'react';
import useAlertStore from '../../../store/alertStore';
import styles from './Alert.module.css';

// Configuración griega por tipo
const TYPES = {
  success: {
    icon: 'Ν',        // Ni — nike (victoria)
    label: 'Νίκη',   // Nike
    display: 'Éxito',
    duration: 4000,
  },
  warning: {
    icon: 'Δ',        // Delta — cambio, peligro
    label: 'Δέλτα',
    display: 'Atención',
    duration: 5000,
  },
  error: {
    icon: 'Ω',        // Omega — fin, error grave
    label: 'Ὦ μέγα',
    display: 'Error',
    duration: 6000,
  },
  info: {
    icon: 'Λ',        // Lambda — logo de Agorá
    label: 'Ἀγορά',
    display: 'Info',
    duration: 4000,
  },
};

const MEANDER = '─┐└─┘┌─┐└─';

export default function Alert() {
  const { alert, hideAlert } = useAlertStore();

  useEffect(() => {
    if (!alert) return;
    const t = TYPES[alert.type] || TYPES.info;
    const timer = setTimeout(hideAlert, t.duration);
    return () => clearTimeout(timer);
  }, [alert]);

  if (!alert) return null;

  const t = TYPES[alert.type] || TYPES.info;

  return (
    <div className={styles.overlay}>
      <div className={`${styles.alert} ${styles[alert.type]}`}>

        {/* Franja superior con meandro */}
        <div className={styles.topBar} />

        {/* Cuerpo */}
        <div className={styles.body}>
          <div className={styles.iconWrap}>
            <span className={styles.icon}>{t.icon}</span>
          </div>

          <div className={styles.content}>
            <div className={styles.type}>{t.label}</div>
            {alert.title && (
              <div className={styles.title}>{alert.title}</div>
            )}
            {alert.message && (
              <div className={styles.message}>{alert.message}</div>
            )}
          </div>

          <button className={styles.close} onClick={hideAlert}>✕</button>
        </div>

        {/* Ornamento inferior */}
        <div className={styles.footer}>{MEANDER}</div>

        {/* Barra de progreso */}
        <div
          className={styles.progress}
          style={{ animationDuration: `${t.duration}ms` }}
        />
      </div>
    </div>
  );
}
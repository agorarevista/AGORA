import { Link } from 'react-router-dom';
import styles from './Footer.module.css';
import useThemeStore from '../../../store/themeStore';
import logoBlack from '../../../assets/AGORABLACK.png';
import logoWhite from '../../../assets/AGORAWHITE.png';

const GREEK_QUOTES = [
  '"Γνῶθι σεαυτόν" — Conócete a ti mismo.',
  '"Παιδεία" — La educación es el alma de la cultura.',
  '"Ἀγορά" — El espacio donde las ideas encuentran voz.',
  '"Μηδὲν ἄγαν" — Nada en exceso.',
];

function GreekCorner({ flipX = false, flipY = false }) {
  return (
    <svg
      viewBox="0 0 52 52"
      width="52"
      height="52"
      className={styles.corner}
      style={{ transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})` }}
      aria-hidden="true"
    >
      <path d="M50,2 L2,2 L2,50" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="square" />
      <path d="M42,10 L10,10 L10,42" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="square" opacity="0.6" />
      <path d="M34,18 L18,18 L18,34" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="square" opacity="0.35" />
    </svg>
  );
}

// Íconos SVG inline para redes sociales
function IconInstagram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

function IconSubstack() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/>
    </svg>
  );
}

export default function Footer() {
  const quote = GREEK_QUOTES[Math.floor(Math.random() * GREEK_QUOTES.length)];
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const logoSrc = isDark ? logoWhite : logoBlack;

  return (
    <footer className={styles.footer}>
      <div className={styles.meander} />

      <div className={styles.body}>
        <GreekCorner />
        <GreekCorner flipX />
        <GreekCorner flipY />
        <GreekCorner flipX flipY />

        <div className={styles.grid}>
          {/* Marca */}
          <div className={styles.brand}>
            <Link to="/" className={styles.logoWrap}>
              <img src={logoSrc} alt="Agorá Revista" className={styles.logoImg} />
            </Link>
            <p>
              Revista digital dedicada a la difusión cultural y artística
              desde el noroeste de México. Diez ediciones construyendo
              comunidad entre lectores y creadores.
            </p>

            {/* Redes sociales */}
            <div className={styles.socials}>
              <a
                href="https://www.instagram.com/agora_revista/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                title="Instagram"
              >
                <IconInstagram />
                <span>Instagram</span>
              </a>

              <a
                href="https://facebook.com/agorarevista"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                title="Facebook"
              >
                <IconFacebook />
                <span>Facebook</span>
              </a>

              <a
                href="https://agorarevista.substack.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                title="Substack"
              >
                <IconSubstack />
                <span>Substack</span>
              </a>
            </div>
          </div>

          {/* Secciones */}
          <div className={styles.col}>
            <h4>Secciones</h4>
            <ul>
              <li><Link to="/categoria/diario">Diario</Link></li>
              <li><Link to="/categoria/critica">Crítica</Link></li>
              <li><Link to="/categoria/ensayos">Ensayos</Link></li>
              <li><Link to="/categoria/creacion">Creación</Link></li>
              <li><Link to="/categoria/audio-y-video">Audio y Video</Link></li>
            </ul>
          </div>

          {/* Revista */}
          <div className={styles.col}>
            <h4>Revista</h4>
            <ul>
              <li><Link to="/categoria/revista-actual">Edición Actual</Link></li>
              <li><Link to="/categoria/colecciones">Colecciones</Link></li>
              <li><Link to="/buscar">Buscar</Link></li>
              <li><Link to="/convocatoria">Convocatoria</Link></li>
              <li><Link to="/admin/login">Equipo editorial</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.separator}>
          <div className={styles.separatorLine} />
          <span className={styles.separatorSymbol}>Λ</span>
          <div className={styles.separatorLine} />
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} Agorá Revista — Todos los derechos reservados</p>
          <p className={styles.quote}>{quote}</p>
        </div>
      </div>
    </footer>
  );
}
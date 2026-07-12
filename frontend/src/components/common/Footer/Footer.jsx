import { Link } from 'react-router-dom';
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
} from 'react-icons/fa6';
import { SiSubstack } from 'react-icons/si';
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

const SOCIAL_LINKS = [
  {
    key: 'instagram',
    name: 'Instagram',
    href: 'https://www.instagram.com/agora_revista/',
    icon: <FaInstagram size={19} />,
  },
  {
    key: 'facebook',
    name: 'Facebook',
    href: 'https://facebook.com/agorarevista',
    icon: <FaFacebookF size={18} />,
  },
  {
    key: 'youtube',
    name: 'YouTube',
    href: 'https://www.youtube.com/@agorarevistamx',
    icon: <FaYoutube size={20} />,
  },
  {
    key: 'substack',
    name: 'Substack',
    href: 'https://agorarevista.substack.com',
    icon: <SiSubstack size={18} />,
  },
];

const FOOTER_GROUPS = [
  {
    key: 'ediciones',
    title: 'Ediciones',
    links: [
      { name: 'La Revista', to: '/ediciones' },
      { name: 'Ediciones Especiales', to: '/ediciones-especiales' },
    ],
  },
  {
    key: 'secciones',
    title: 'Secciones',
    links: [
      { name: 'Poesía', to: '/categoria/poesia' },
      { name: 'Narrativa', to: '/categoria/narrativa' },
      { name: 'Ensayo', to: '/categoria/ensayo' },
      { name: 'Crítica', to: '/categoria/critica' },
      { name: 'Pensamiento', to: '/categoria/pensamiento' },
      { name: 'Galería', to: '/categoria/galeria' },
      { name: 'Entrevista', to: '/categoria/entrevista' },
      { name: 'Cultural', to: '/categoria/cultural' },
    ],
  },
  {
    key: 'columnas',
    title: 'Columnas',
    links: [
      { name: 'Artestigo', to: '/categoria/artestigo' },
      { name: 'Entretanto', to: '/categoria/entretanto' },
      { name: 'Liceo', to: '/categoria/liceo' },
      { name: 'Lo Que Habito', to: '/categoria/lo-que-habito' },
      { name: 'Menguante', to: '/categoria/menguante' },
      { name: 'Palabrante', to: '/categoria/palabrante' },
      { name: 'Palimpsesto', to: '/categoria/palimpsesto' },
      { name: 'Punktum', to: '/categoria/punktum' },
      { name: 'Vórtice', to: '/categoria/vortice' },
    ],
  },
  {
    key: 'agora',
    title: 'Agorá',
    links: [
      { name: 'Colaboraciones', to: '/convocatorias' },
      { name: 'Nosotros', to: '/quienes-somos' },
      { name: 'Equipo editorial', to: '/admin/login' },
    ],
  },
];

function GreekCorner({ flipX = false, flipY = false }) {
  return (
    <svg
      viewBox="0 0 52 52"
      width="52"
      height="52"
      className={styles.corner}
      style={{
        transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`,
      }}
      aria-hidden="true"
    >
      <path
        d="M50,2 L2,2 L2,50"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
        strokeLinecap="square"
      />

      <path
        d="M42,10 L10,10 L10,42"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeLinecap="square"
        opacity="0.6"
      />

      <path
        d="M34,18 L18,18 L18,34"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="square"
        opacity="0.35"
      />
    </svg>
  );
}

export default function Footer() {
  const quote =
    GREEK_QUOTES[Math.floor(Math.random() * GREEK_QUOTES.length)];

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
          {/* ── MARCA ─────────────────────────────────── */}
          <div className={styles.brand}>
            <Link
              to="/"
              className={styles.logoWrap}
              aria-label="Ir al inicio de Agorá Revista"
            >
              <img
                src={logoSrc}
                alt="Agorá Revista"
                className={styles.logoImg}
              />
            </Link>

            <p className={styles.brandDescription}>
              Revista digital dedicada a la difusión cultural y artística
              desde el noroeste de México. Un espacio para la palabra, la
              creación y el pensamiento contemporáneo.
            </p>

            <div className={styles.socials}>
              {SOCIAL_LINKS.map(social => (
                <a
                  key={social.key}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  title={social.name}
                  aria-label={social.name}
                >
                  <span className={styles.socialIcon}>
                    {social.icon}
                  </span>

                  <span className={styles.socialName}>
                    {social.name}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* ── NAVEGACIÓN DEL FOOTER ─────────────────── */}
          <div className={styles.navigationGrid}>
            {FOOTER_GROUPS.map(group => (
              <div
                key={group.key}
                className={styles.col}
              >
                <h4>{group.title}</h4>

                <ul>
                  {group.links.map(link => (
                    <li key={link.to}>
                      <Link to={link.to}>
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.separator}>
          <div className={styles.separatorLine} />

          <span className={styles.separatorSymbol}>
            Λ
          </span>

          <div className={styles.separatorLine} />
        </div>

        <div className={styles.bottom}>
          <p>
            © {new Date().getFullYear()} Agorá Revista — Todos los derechos reservados
          </p>

          <p className={styles.quote}>
            {quote}
          </p>
        </div>
      </div>
    </footer>
  );
}
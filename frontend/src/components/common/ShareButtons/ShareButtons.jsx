import { registerShare } from '../../../api/shares.api';
import styles from './ShareButtons.module.css';

const PLATFORMS = [
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬',
    url: (u, t) => `https://wa.me/?text=${encodeURIComponent(t + ' ' + u)}` },
  { id: 'facebook', label: 'Facebook', icon: '📘',
    url: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { id: 'instagram', label: 'IG', icon: '📷',
    url: null }, // Instagram no tiene URL directa, copiamos
  { id: 'twitter', label: 'Twitter/X', icon: '🐦',
    url: (u, t) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}` },
  { id: 'copy', label: 'Copiar', icon: '🔗',
    url: null },
];

export default function ShareButtons({ article }) {
  const url   = window.location.href;
  const title = article.title;

  const handle = async (platform, urlFn) => {
    // Registrar en analytics
    registerShare(article.id, platform).catch(() => {});

    if (platform === 'copy' || platform === 'instagram') {
      await navigator.clipboard.writeText(url);
      alert(platform === 'instagram'
        ? 'Enlace copiado — pégalo en tu historia de Instagram'
        : '¡Enlace copiado!'
      );
      return;
    }

    if (urlFn) {
      window.open(urlFn(url, title), '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>Compartir</span>
      <div className={styles.buttons}>
        {PLATFORMS.map(p => (
          <button
            key={p.id}
            onClick={() => handle(p.id, p.url)}
            className={styles.btn}
            title={p.label}
          >
            <span>{p.icon}</span>
            <span className={styles.btnLabel}>{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
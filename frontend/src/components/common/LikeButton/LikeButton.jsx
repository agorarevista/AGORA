import { useEffect, useState, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { getLikes, toggleLike, checkLike } from '../../../api/likes.api';
import styles from './LikeButton.module.css';

function getVisitorId() {
  const KEY = 'agora_visitor_id';
  let visitorId = localStorage.getItem(KEY);

  if (!visitorId) {
    visitorId =
      (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    localStorage.setItem(KEY, visitorId);
  }

  return visitorId;
}

export default function LikeButton({ articleId }) {
  const [likes, setLikes]       = useState(0);
  const [liked, setLiked]       = useState(false);
  const [loading, setLoading]   = useState(false);
  const [burst, setBurst]       = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const loadLikes = useCallback(async () => {
    try {
      const visitorId = getVisitorId();

      const [likesRes, checkRes] = await Promise.all([
        getLikes(articleId, { visitorId }),
        checkLike(articleId, { visitorId }),
      ]);

      setLikes(likesRes.likes || 0);
      setLiked(!!checkRes.liked);
    } catch {
    } finally {
      setHydrated(true);
    }
  }, [articleId]);

  useEffect(() => {
    loadLikes();

    const interval = setInterval(() => {
      loadLikes();
    }, 2500);

    return () => clearInterval(interval);
  }, [loadLikes]);

  const handle = async () => {
    if (loading) return;
    setLoading(true);

    if (!liked) {
      setBurst(true);
      setTimeout(() => setBurst(false), 600);
    }

    try {
      const visitorId = getVisitorId();
      const res = await toggleLike(articleId, { visitorId });
      setLikes(res.likes);
      setLiked(res.liked);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handle}
      className={`${styles.btn} ${hydrated && liked ? styles.liked : ''} ${burst ? styles.burst : ''}`}
      title={liked ? 'Quitar me gusta' : 'Me gusta'}
      disabled={loading}
    >
      <span className={styles.iconWrap}>
        <span className={styles.icon}>
          <Heart
            size={22}
            strokeWidth={1.9}
            className={styles.heartSvg}
            fill={hydrated && liked ? 'currentColor' : 'none'}
          />
        </span>

        {burst && (
          <span className={styles.particles} aria-hidden="true">
            {[...Array(6)].map((_, i) => (
              <span key={i} className={`${styles.particle} ${styles[`p${i}`]}`} />
            ))}
          </span>
        )}
      </span>

      <span className={styles.count}>{likes}</span>
    </button>
  );
}
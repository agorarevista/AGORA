import { useEffect, useState } from 'react';
import { getLikes, toggleLike, checkLike } from '../../../api/likes.api';
import styles from './LikeButton.module.css';

export default function LikeButton({ articleId }) {
  const [likes, setLikes]   = useState(0);
  const [liked, setLiked]   = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getLikes(articleId).then(d => setLikes(d.likes)).catch(() => {});
    checkLike(articleId).then(d => setLiked(d.liked)).catch(() => {});
  }, [articleId]);

  const handle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await toggleLike(articleId);
      setLikes(res.likes);
      setLiked(res.liked);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handle}
      disabled={loading}
      className={`${styles.btn} ${liked ? styles.liked : ''}`}
      title={liked ? 'Quitar me gusta' : 'Me gusta'}
    >
      <span className={styles.heart}>{liked ? '♥' : '♡'}</span>
      <span className={styles.count}>{likes}</span>
      <span className={styles.label}>{liked ? 'Te gustó' : 'Me gusta'}</span>
    </button>
  );
}
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getEditions } from '../../api/editions.api';
import { formatDate } from '../../utils/formatDate';
import { BookOpen } from 'lucide-react';
import styles from './EdicionesPage.module.css';

export default function EdicionesPage() {
  const [editions, setEditions] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getEditions()
      .then(data => setEditions((data || []).filter(e => !e.is_special)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>Revista</span>
          <h1 className={styles.title}>Todas las ediciones</h1>
        </div>
      </div>
      <div className={styles.meander} />
      <div className={styles.body}>
        {loading ? (
          <div className={styles.grid}>
            {[1,2,3,4,5,6].map(i => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : editions.length === 0 ? (
          <div className={styles.empty}>
            <BookOpen size={32} style={{ opacity: 0.3 }} />
            <p>No hay ediciones disponibles</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {editions.map((ed, i) => (
              <motion.div
                key={ed.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.06 }}
              >
                <Link to={`/edicion/${ed.number}`} className={`${styles.card} ${ed.is_current ? styles.cardCurrent : ''}`}>
                  <div className={styles.cover}>
                    {ed.cover_image_url
                      ? <img src={ed.cover_image_url} alt={ed.name} />
                      : <div className={styles.coverEmpty}><BookOpen size={28} /></div>
                    }
                    {ed.is_current && <span className={styles.badge}>Edición actual</span>}
                  </div>
                  <div className={styles.info}>
                    <span className={styles.number}>№ {ed.number}</span>
                    <h3 className={styles.name}>{ed.name}</h3>
                    {ed.description && <p className={styles.desc}>{ed.description}</p>}
                    {ed.published_at && <span className={styles.date}>{formatDate(ed.published_at)}</span>}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
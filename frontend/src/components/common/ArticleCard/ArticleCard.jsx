import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { formatDate } from '../../../utils/formatDate';
import styles from './ArticleCard.module.css';

export default function ArticleCard({ article }) {
  if (!article) return null;

  const {
    slug,
    title,
    excerpt,
    cover_image_url,
    reading_time,
    published_at,
  } = article;

  // El autor puede venir como `collaborators` o `collaborator`
  const collab = article.collaborators || article.collaborator || null;

  // La categoría suele venir en article_categories[0].categories
  const category =
    article.article_categories?.[0]?.categories ||
    article.category ||
    null;

  return (
    <Link to={`/articulos/${slug}`} className={styles.card}>
      <div className={styles.cover}>
        {cover_image_url ? (
          <img src={cover_image_url} alt={title} loading="lazy" />
        ) : (
          <div className={styles.coverEmpty}><span>Λ</span></div>
        )}
      </div>

      <div className={styles.body}>
        {category && (
          <span className={styles.cat}>{category.name}</span>
        )}

        <h3 className={styles.title}>{title}</h3>

        {excerpt && <p className={styles.excerpt}>{excerpt}</p>}

        {collab && (
          <div className={styles.author}>{collab.name}</div>
        )}

        <div className={styles.meta}>
          {published_at && <span>{formatDate(published_at)}</span>}
          {reading_time && (
            <>
              <span className={styles.dot}>·</span>
              <Clock size={11} />
              <span>{reading_time}′</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getAllComments, updateCommentStatus, deleteComment } from '../../api/comments.api';
import useAlert from '../../hooks/useAlert';
import { Check, X, Trash2, MessageCircle, Eye } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';
import { Link } from 'react-router-dom';
import styles from './CommentsPage.module.css';

const STATUS_LABELS = {
  pending:  { label: 'Pendiente',  color: '#92400E', bg: '#FEF3C7' },
  approved: { label: 'Aprobado',   color: '#065F46', bg: '#D1FAE5' },
  rejected: { label: 'Rechazado',  color: '#6B7280', bg: '#F3F4F6' },
};

export default function CommentsPage() {
  const alert = useAlert();
  const [comments, setComments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('pending');

const load = async () => {
  setLoading(true);
  try {
    const data = await getAllComments({ status: filter });
    setComments(data || []);
  } catch { alert.error('Error', 'No se pudieron cargar los comentarios'); }
  finally { setLoading(false); }
};

  useEffect(() => { load(); }, [filter]);

const handleApprove = async (id) => {
  try {
    await updateCommentStatus(id, 'approved');
    alert.success('Aprobado', 'Comentario publicado');
    load();
  } catch { alert.error('Error', 'No se pudo aprobar'); }
};

const handleReject = async (id) => {
  try {
    await updateCommentStatus(id, 'rejected');
    alert.success('Rechazado', 'Comentario rechazado');
    load();
  } catch { alert.error('Error', 'No se pudo rechazar'); }
};

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este comentario permanentemente?')) return;
    try {
      await deleteComment(id);
      alert.success('Eliminado', 'Comentario eliminado');
      load();
    } catch { alert.error('Error', 'No se pudo eliminar'); }
  };

  const pending  = comments.filter(c => c.status === 'pending').length;

  return (
    <div className={styles.page}>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.header}
      >
        <div>
          <div className={styles.headerLabel}>Moderación</div>
          <h1 className={styles.headerTitle}>
            Comentarios
            {pending > 0 && <span className={styles.pendingBadge}>{pending} pendientes</span>}
          </h1>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {['pending', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`${styles.tab} ${filter === s ? styles.tabActive : ''}`}
          >
            {STATUS_LABELS[s].label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className={styles.skeleton}>
          {[1,2,3,4].map(i => <div key={i} className={styles.skeletonRow} />)}
        </div>
      ) : comments.length === 0 ? (
        <div className={styles.empty}>
          <MessageCircle size={28} />
          <p>No hay comentarios {STATUS_LABELS[filter]?.label.toLowerCase()}s</p>
        </div>
      ) : (
        <div className={styles.list}>
          {comments.map((c, i) => {
            const s = STATUS_LABELS[c.status] || STATUS_LABELS.pending;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={styles.card}
              >
                {/* Header */}
                <div className={styles.cardTop}>
                  <div className={styles.authorAvatar}>
                    {c.author_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className={styles.cardMeta}>
                    <span className={styles.authorName}>{c.author_name}</span>
                    {c.author_email && (
                      <span className={styles.authorEmail}>{c.author_email}</span>
                    )}
                    <span className={styles.commentDate}>{formatDate(c.created_at)}</span>
                  </div>
                  <span
                    className={styles.statusBadge}
                    style={{ background: s.bg, color: s.color }}
                  >
                    {s.label}
                  </span>
                </div>

                {/* Contenido */}
                <p className={styles.commentText}>{c.content}</p>
                {/* Artículo al que pertenece */}
                {c.articles && (
                  <div className={styles.articleRef}>
                    <MessageCircle size={12} />
                    <span>En: </span>
                    <Link
                      to={`/articulos/${c.articles.slug}`}
                      target="_blank"
                      className={styles.articleLink}
                    >
                      {c.articles.title}
                    </Link>

                    <a
                      href={`/articulos/${c.articles.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.viewBtn}
                    >
                      <Eye size={12} />
                    </a>
                  </div>
                )}

                {/* Respuesta padre si es reply */}
                {c.parent_id && (
                  <div className={styles.replyNote}>
                    ↳ Respuesta a otro comentario
                  </div>
                )}

                {/* Acciones */}
                <div className={styles.cardActions}>
                  {c.status !== 'approved' && (
                    <button
                      className={`${styles.actionBtn} ${styles.actionApprove}`}
                      onClick={() => handleApprove(c.id)}
                      title="Aprobar"
                    >
                      <Check size={14} /> Aprobar
                    </button>
                  )}
                  {c.status !== 'rejected' && (
                    <button
                      className={`${styles.actionBtn} ${styles.actionReject}`}
                      onClick={() => handleReject(c.id)}
                      title="Rechazar"
                    >
                      <X size={14} /> Rechazar
                    </button>
                  )}
                  <button
                    className={`${styles.actionBtn} ${styles.actionDelete}`}
                    onClick={() => handleDelete(c.id)}
                    title="Eliminar"
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
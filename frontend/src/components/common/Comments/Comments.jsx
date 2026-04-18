import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getComments, createComment } from '../../../api/comments.api';
import { formatDate } from '../../../utils/formatDate';
import styles from './Comments.module.css';

export default function Comments({ articleId, onCountChange }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState({ author_name: '', author_email: '', content: '' });
  const [replyTo, setReplyTo]   = useState(null);
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);

  const loadComments = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await getComments(articleId);
      setComments(data);

      const totalCount = (data || []).reduce((acc, item) => {
        return acc + 1 + (item.replies?.length || 0);
      }, 0);

      onCountChange?.(totalCount);
    } catch {
    } finally {
      if (!silent) setLoading(false);
    }
  }, [articleId, onCountChange]);

  useEffect(() => {
    loadComments(false);

    const interval = setInterval(() => {
      loadComments(true);
    }, 2500);

    return () => clearInterval(interval);
  }, [loadComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.author_name.trim() || !form.content.trim()) return;
    setSending(true);
    try {
      await createComment({
        article_id: articleId,
        parent_id: replyTo || null,
        author_name: form.author_name,
        author_email: form.author_email,
        content: form.content,
      });
      setSent(true);
      setForm({ author_name: '', author_email: '', content: '' });
      setReplyTo(null);
      loadComments(true);
    } catch {
      alert('No se pudo enviar el comentario');
    } finally {
      setSending(false);
    }
  };

  const CARD_COLORS = ['#8B1A4A', '#1B4F8A', '#2E6E3E', '#B8860B', '#5A2D82'];

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          Comentarios
          {comments.length > 0 && <span className={styles.badge}>{comments.length}</span>}
        </h3>
      </div>

      {/* Lista */}
      {loading ? (
        <div className={styles.loading}>Cargando...</div>
      ) : comments.length === 0 ? (
        <div className={styles.empty}>Sé el primero en comentar.</div>
      ) : (
        <div className={styles.list}>
          {comments.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={styles.card}
              style={{ borderLeftColor: CARD_COLORS[i % CARD_COLORS.length] }}
            >
              <div className={styles.cardHeader}>
                <div
                  className={styles.avatar}
                  style={{ background: CARD_COLORS[i % CARD_COLORS.length] }}
                >
                  {c.author_name[0].toUpperCase()}
                </div>
                <div>
                  <div className={styles.authorName}>{c.author_name}</div>
                  <div className={styles.date}>{formatDate(c.created_at)}</div>
                </div>
                <button
                  className={styles.replyBtn}
                  onClick={() => setReplyTo(c.id)}
                >
                  Responder
                </button>
              </div>
              <p className={styles.cardText}>{c.content}</p>

              {/* Respuestas */}
              {c.replies?.length > 0 && (
                <div className={styles.replies}>
                  {c.replies.map((r, j) => (
                    <div key={r.id} className={styles.reply}>
                      <div
                        className={styles.avatarSm}
                        style={{ background: CARD_COLORS[(i + j + 1) % CARD_COLORS.length] }}
                      >
                        {r.author_name[0].toUpperCase()}
                      </div>
                      <div className={styles.replyBody}>
                        <span className={styles.replyAuthor}>{r.author_name}</span>
                        <p className={styles.replyText}>{r.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Formulario */}
      <div className={styles.formWrap}>
        <h4 className={styles.formTitle}>
          {replyTo ? (
            <>
              Respondiendo a un comentario
              <button className={styles.cancelReply} onClick={() => setReplyTo(null)}>
                Cancelar
              </button>
            </>
          ) : 'Deja un comentario'}
        </h4>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.sentMsg}
          >
            ✓ Tu comentario fue enviado y está pendiente de aprobación. ¡Gracias!
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.fieldCard}`}>
                <label className={styles.label}>Nombre *</label>
                <input
                  type="text"
                  value={form.author_name}
                  onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))}
                  className={styles.input}
                  placeholder="Tu nombre"
                  required
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fieldCard}`}>
                <label className={styles.label}>Email (opcional)</label>
                <input
                  type="email"
                  value={form.author_email}
                  onChange={e => setForm(f => ({ ...f, author_email: e.target.value }))}
                  className={styles.input}
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div className={`${styles.formGroup} ${styles.fieldCard} ${styles.fieldCardLg}`}>
              <label className={styles.label}>Comentario *</label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                className={styles.textarea}
                placeholder="Escribe tu comentario..."
                rows={5}
                maxLength={1000}
                required
              />
              <div className={styles.charCount}>{form.content.length}/1000</div>
            </div>

            <div className={styles.formActions}>
              <p className={styles.note}>Tu comentario se publica al momento y se actualiza automáticamente.</p>
              <button type="submit" disabled={sending} className={styles.submitBtn}>
                {sending ? 'Enviando...' : 'Publicar comentario'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
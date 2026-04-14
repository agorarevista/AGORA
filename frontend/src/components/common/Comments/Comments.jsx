import { useEffect, useState } from 'react';
import { getComments, createComment } from '../../../api/comments.api';
import { formatDate } from '../../../utils/formatDate';
import styles from './Comments.module.css';

export default function Comments({ articleId }) {
  const [comments, setComments]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [form, setForm]           = useState({ author_name: '', author_email: '', content: '', parent_id: null });
  const [sending, setSending]     = useState(false);
  const [sent, setSent]           = useState(false);
  const [replyTo, setReplyTo]     = useState(null);

  useEffect(() => {
    getComments(articleId)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [articleId]);

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
      setForm({ author_name: '', author_email: '', content: '', parent_id: null });
      setReplyTo(null);
    } catch (err) {
      alert('No se pudo enviar el comentario');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          ❧ Comentarios
          {comments.length > 0 && (
            <span className={styles.count}>{comments.length}</span>
          )}
        </h3>
      </div>

      {/* Lista de comentarios */}
      {loading ? (
        <div className={styles.loading}>Cargando comentarios...</div>
      ) : comments.length === 0 ? (
        <div className={styles.empty}>
          Sé el primero en comentar este artículo.
        </div>
      ) : (
        <div className={styles.list}>
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={(id) => setReplyTo(id)}
            />
          ))}
        </div>
      )}

      {/* Formulario */}
      <div className={styles.formWrap}>
        <h4 className={styles.formTitle}>
          {replyTo ? 'Respondiendo...' : 'Deja un comentario'}
          {replyTo && (
            <button className={styles.cancelReply} onClick={() => setReplyTo(null)}>
              Cancelar
            </button>
          )}
        </h4>

        {sent ? (
          <div className={styles.sentMsg}>
            ✓ Tu comentario fue enviado y está pendiente de aprobación. ¡Gracias!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nombre *</label>
                <input
                  type="text"
                  value={form.author_name}
                  onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))}
                  className={styles.input}
                  placeholder="Tu nombre"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email (opcional)</label>
                <input
                  type="email"
                  value={form.author_email}
                  onChange={e => setForm(f => ({ ...f, author_email: e.target.value }))}
                  className={styles.input}
                  placeholder="tu@email.com"
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Comentario *</label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                className={styles.textarea}
                placeholder="Escribe tu comentario..."
                rows={4}
                maxLength={1000}
                required
              />
              <div className={styles.charCount}>{form.content.length}/1000</div>
            </div>
            <button type="submit" disabled={sending} className={styles.submitBtn}>
              {sending ? 'Enviando...' : 'Enviar comentario'}
            </button>
            <p className={styles.note}>
              Los comentarios son moderados antes de publicarse.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}

function CommentItem({ comment, onReply }) {
  return (
    <div className={styles.comment}>
      <div className={styles.commentAvatar}>
        {comment.author_name[0].toUpperCase()}
      </div>
      <div className={styles.commentBody}>
        <div className={styles.commentHeader}>
          <span className={styles.commentAuthor}>{comment.author_name}</span>
          <span className={styles.commentDate}>{formatDate(comment.created_at)}</span>
        </div>
        <p className={styles.commentText}>{comment.content}</p>
        <button className={styles.replyBtn} onClick={() => onReply(comment.id)}>
          Responder
        </button>

        {/* Respuestas */}
        {comment.replies?.length > 0 && (
          <div className={styles.replies}>
            {comment.replies.map(reply => (
              <div key={reply.id} className={styles.reply}>
                <div className={styles.commentAvatar} style={{ width: 28, height: 28, fontSize: 12 }}>
                  {reply.author_name[0].toUpperCase()}
                </div>
                <div className={styles.commentBody}>
                  <div className={styles.commentHeader}>
                    <span className={styles.commentAuthor}>{reply.author_name}</span>
                    <span className={styles.commentDate}>{formatDate(reply.created_at)}</span>
                  </div>
                  <p className={styles.commentText}>{reply.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
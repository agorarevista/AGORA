import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  motion,
} from 'framer-motion';

import {
  createComment,
  getComments,
} from '../../../api/comments.api';

import {
  formatDate,
} from '../../../utils/formatDate';

import styles from './Comments.module.css';

const CARD_COLORS = [
  '#8B1A4A',
  '#1B4F8A',
  '#2E6E3E',
  '#B8860B',
  '#5A2D82',
];

export default function Comments({
  contentId,
  contentType = 'article',

  /*
   * Compatibilidad temporal con:
   * <Comments articleId={article.id} />
   */
  articleId,

  onCountChange,
}) {
  const resolvedContentId =
    contentId ||
    articleId;

  const [
    comments,
    setComments,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    form,
    setForm,
  ] = useState({
    author_name: '',
    author_email: '',
    content: '',
  });

  const [
    replyTo,
    setReplyTo,
  ] = useState(null);

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    sent,
    setSent,
  ] = useState(false);

  const loadComments =
    useCallback(
      async (
        silent = false
      ) => {
        if (
          !resolvedContentId
        ) {
          return;
        }

        try {
          if (!silent) {
            setLoading(true);
          }

          const data =
            await getComments(
              contentType,
              resolvedContentId
            );

          const normalizedData =
            Array.isArray(data)
              ? data
              : [];

          setComments(
            normalizedData
          );

          const totalCount =
            normalizedData.reduce(
              (
                accumulator,
                item
              ) => {
                return (
                  accumulator +
                  1 +
                  (
                    item.replies
                      ?.length ||
                    0
                  )
                );
              },
              0
            );

          onCountChange?.(
            totalCount
          );
        } catch {
          // No bloqueamos la publicación.
        } finally {
          if (!silent) {
            setLoading(false);
          }
        }
      },
      [
        contentType,
        resolvedContentId,
        onCountChange,
      ]
    );

  useEffect(() => {
    if (
      !resolvedContentId
    ) {
      return undefined;
    }

    loadComments(false);

    const interval =
      window.setInterval(
        () => {
          loadComments(true);
        },
        2500
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    resolvedContentId,
    loadComments,
  ]);

  const handleSubmit =
    async event => {
      event.preventDefault();

      if (
        !form.author_name.trim() ||
        !form.content.trim() ||
        !resolvedContentId
      ) {
        return;
      }

      setSending(true);
      setSent(false);

      try {
        await createComment({
          content_type:
            contentType,

          content_id:
            resolvedContentId,

          parent_id:
            replyTo ||
            null,

          author_name:
            form.author_name,

          author_email:
            form.author_email,

          content:
            form.content,
        });

        setSent(true);

        setForm({
          author_name: '',
          author_email: '',
          content: '',
        });

        setReplyTo(null);

        await loadComments(
          true
        );
      } catch {
        window.alert(
          'No se pudo enviar el comentario'
        );
      } finally {
        setSending(false);
      }
    };

  return (
    <div
      className={
        styles.wrap
      }
    >
      <div
        className={
          styles.header
        }
      >
        <h3
          className={
            styles.title
          }
        >
          Comentarios

          {comments.length >
            0 && (
            <span
              className={
                styles.badge
              }
            >
              {comments.reduce(
                (
                  accumulator,
                  comment
                ) =>
                  accumulator +
                  1 +
                  (
                    comment
                      .replies
                      ?.length ||
                    0
                  ),
                0
              )}
            </span>
          )}
        </h3>
      </div>

      {loading ? (
        <div
          className={
            styles.loading
          }
        >
          Cargando...
        </div>
      ) : comments.length ===
        0 ? (
        <div
          className={
            styles.empty
          }
        >
          Sé el primero en comentar.
        </div>
      ) : (
        <div
          className={
            styles.list
          }
        >
          {comments.map(
            (
              comment,
              index
            ) => (
              <motion.div
                key={
                  comment.id
                }
                initial={{
                  opacity: 0,
                  x: -16,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  delay:
                    index *
                    0.06,
                }}
                className={
                  styles.card
                }
                style={{
                  borderLeftColor:
                    CARD_COLORS[
                      index %
                      CARD_COLORS.length
                    ],
                }}
              >
                <div
                  className={
                    styles.cardHeader
                  }
                >
                  <div
                    className={
                      styles.avatar
                    }
                    style={{
                      background:
                        CARD_COLORS[
                          index %
                          CARD_COLORS.length
                        ],
                    }}
                  >
                    {comment
                      .author_name
                      ?.charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <div
                      className={
                        styles.authorName
                      }
                    >
                      {
                        comment.author_name
                      }
                    </div>

                    <div
                      className={
                        styles.date
                      }
                    >
                      {formatDate(
                        comment.created_at
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className={
                      styles.replyBtn
                    }
                    onClick={() => {
                      setSent(false);

                      setReplyTo(
                        comment.id
                      );
                    }}
                  >
                    Responder
                  </button>
                </div>

                <p
                  className={
                    styles.cardText
                  }
                >
                  {comment.content}
                </p>

                {comment.replies
                  ?.length >
                  0 && (
                  <div
                    className={
                      styles.replies
                    }
                  >
                    {comment.replies.map(
                      (
                        reply,
                        replyIndex
                      ) => (
                        <div
                          key={
                            reply.id
                          }
                          className={
                            styles.reply
                          }
                        >
                          <div
                            className={
                              styles.avatarSm
                            }
                            style={{
                              background:
                                CARD_COLORS[
                                  (
                                    index +
                                    replyIndex +
                                    1
                                  ) %
                                  CARD_COLORS.length
                                ],
                            }}
                          >
                            {reply
                              .author_name
                              ?.charAt(0)
                              .toUpperCase()}
                          </div>

                          <div
                            className={
                              styles.replyBody
                            }
                          >
                            <span
                              className={
                                styles.replyAuthor
                              }
                            >
                              {
                                reply.author_name
                              }
                            </span>

                            <p
                              className={
                                styles.replyText
                              }
                            >
                              {
                                reply.content
                              }
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </motion.div>
            )
          )}
        </div>
      )}

      <div
        className={
          styles.formWrap
        }
      >
        <h4
          className={
            styles.formTitle
          }
        >
          {replyTo ? (
            <>
              Respondiendo a un comentario

              <button
                type="button"
                className={
                  styles.cancelReply
                }
                onClick={() => {
                  setReplyTo(null);
                }}
              >
                Cancelar
              </button>
            </>
          ) : (
            'Deja un comentario'
          )}
        </h4>

        {sent ? (
          <motion.div
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className={
              styles.sentMsg
            }
          >
            ✓ Tu comentario fue publicado. ¡Gracias!
          </motion.div>
        ) : (
          <form
            onSubmit={
              handleSubmit
            }
            className={
              styles.form
            }
          >
            <div
              className={
                styles.formGrid
              }
            >
              <div
                className={`
                  ${styles.formGroup}
                  ${styles.fieldCard}
                `}
              >
                <label
                  className={
                    styles.label
                  }
                >
                  Nombre *
                </label>

                <input
                  type="text"
                  value={
                    form.author_name
                  }
                  onChange={
                    event => {
                      setForm(
                        current => ({
                          ...current,

                          author_name:
                            event
                              .target
                              .value,
                        })
                      );
                    }
                  }
                  className={
                    styles.input
                  }
                  placeholder="Tu nombre"
                  required
                />
              </div>

              <div
                className={`
                  ${styles.formGroup}
                  ${styles.fieldCard}
                `}
              >
                <label
                  className={
                    styles.label
                  }
                >
                  Email (opcional)
                </label>

                <input
                  type="email"
                  value={
                    form.author_email
                  }
                  onChange={
                    event => {
                      setForm(
                        current => ({
                          ...current,

                          author_email:
                            event
                              .target
                              .value,
                        })
                      );
                    }
                  }
                  className={
                    styles.input
                  }
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div
              className={`
                ${styles.formGroup}
                ${styles.fieldCard}
                ${styles.fieldCardLg}
              `}
            >
              <label
                className={
                  styles.label
                }
              >
                Comentario *
              </label>

              <textarea
                value={
                  form.content
                }
                onChange={
                  event => {
                    setForm(
                      current => ({
                        ...current,

                        content:
                          event
                            .target
                            .value,
                      })
                    );
                  }
                }
                className={
                  styles.textarea
                }
                placeholder="Escribe tu comentario..."
                rows={5}
                maxLength={1000}
                required
              />

              <div
                className={
                  styles.charCount
                }
              >
                {
                  form.content
                    .length
                }
                /1000
              </div>
            </div>

            <div
              className={
                styles.formActions
              }
            >
              <p
                className={
                  styles.note
                }
              >
                Tu comentario se publica al momento y se actualiza automáticamente.
              </p>

              <button
                type="submit"
                disabled={
                  sending
                }
                className={
                  styles.submitBtn
                }
              >
                {sending
                  ? 'Enviando...'
                  : 'Publicar comentario'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
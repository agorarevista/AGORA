import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Heart,
} from 'lucide-react';

import {
  checkLike,
  getLikes,
  toggleLike,
} from '../../../api/likes.api';

import styles from './LikeButton.module.css';

function getVisitorId() {
  const KEY =
    'agora_visitor_id';

  let visitorId =
    localStorage.getItem(
      KEY
    );

  if (!visitorId) {
    visitorId =
      (
        typeof crypto !==
          'undefined' &&
        crypto.randomUUID
      )
        ? crypto.randomUUID()
        : `visitor_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 11)}`;

    localStorage.setItem(
      KEY,
      visitorId
    );
  }

  return visitorId;
}

export default function LikeButton({
  contentId,
  contentType = 'article',

  /*
   * Compatibilidad temporal con:
   * <LikeButton articleId={article.id} />
   */
  articleId,
}) {
  const resolvedContentId =
    contentId ||
    articleId;

  const [
    likes,
    setLikes,
  ] = useState(0);

  const [
    liked,
    setLiked,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    burst,
    setBurst,
  ] = useState(false);

  const [
    hydrated,
    setHydrated,
  ] = useState(false);

  const loadLikes =
    useCallback(
      async () => {
        if (
          !resolvedContentId
        ) {
          return;
        }

        try {
          const visitorId =
            getVisitorId();

          const [
            likesResponse,
            checkResponse,
          ] =
            await Promise.all([
              getLikes(
                contentType,
                resolvedContentId,
                {
                  visitorId,
                }
              ),

              checkLike(
                contentType,
                resolvedContentId,
                {
                  visitorId,
                }
              ),
            ]);

          setLikes(
            likesResponse
              ?.likes ||
            0
          );

          setLiked(
            Boolean(
              checkResponse
                ?.liked
            )
          );
        } catch {
          // La interacción no bloquea
          // la visualización del contenido.
        } finally {
          setHydrated(true);
        }
      },
      [
        contentType,
        resolvedContentId,
      ]
    );

  useEffect(() => {
    if (
      !resolvedContentId
    ) {
      return undefined;
    }

    loadLikes();

    const interval =
      window.setInterval(
        loadLikes,
        2500
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    resolvedContentId,
    loadLikes,
  ]);

  const handle = async () => {
    if (
      loading ||
      !resolvedContentId
    ) {
      return;
    }

    setLoading(true);

    if (!liked) {
      setBurst(true);

      window.setTimeout(
        () => {
          setBurst(false);
        },
        600
      );
    }

    try {
      const visitorId =
        getVisitorId();

      const response =
        await toggleLike(
          contentType,
          resolvedContentId,
          {
            visitorId,
          }
        );

      setLikes(
        response?.likes ||
        0
      );

      setLiked(
        Boolean(
          response?.liked
        )
      );
    } catch {
      // No alteramos visualmente el contenido.
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      className={`
        ${styles.btn}
        ${
          hydrated &&
          liked
            ? styles.liked
            : ''
        }
        ${
          burst
            ? styles.burst
            : ''
        }
      `}
      title={
        liked
          ? 'Quitar me gusta'
          : 'Me gusta'
      }
      aria-label={
        liked
          ? 'Quitar me gusta'
          : 'Me gusta'
      }
      disabled={
        loading ||
        !resolvedContentId
      }
    >
      <span
        className={
          styles.iconWrap
        }
      >
        <span
          className={
            styles.icon
          }
        >
          <Heart
            size={22}
            strokeWidth={1.9}
            className={
              styles.heartSvg
            }
            fill={
              hydrated &&
              liked
                ? 'currentColor'
                : 'none'
            }
          />
        </span>

        {burst && (
          <span
            className={
              styles.particles
            }
            aria-hidden="true"
          >
            {[
              ...Array(6),
            ].map(
              (_, index) => (
                <span
                  key={index}
                  className={`
                    ${styles.particle}
                    ${styles[`p${index}`]}
                  `}
                />
              )
            )}
          </span>
        )}
      </span>

      <span
        className={
          styles.count
        }
      >
        {likes}
      </span>
    </button>
  );
}
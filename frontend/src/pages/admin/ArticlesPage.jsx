import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Link,
  useParams,
} from 'react-router-dom';

import {
  AnimatePresence,
  motion,
} from 'framer-motion';

import {
  getArticle,
} from '../../api/articles.api';

import {
  getComments,
} from '../../api/comments.api';

import {
  formatDate,
} from '../../utils/formatDate';

import {
  ArrowLeft,
  Clock,
  Maximize2,
  MessageCircle,
  Mars,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Venus,
} from 'lucide-react';

import {
  FaFacebookF,
  FaGlobe,
  FaInstagram,
  FaLink,
  FaTiktok,
  FaYoutube,
} from 'react-icons/fa6';

import LikeButton from '../../components/common/LikeButton/LikeButton';
import ShareButtons from '../../components/common/ShareButtons/ShareButtons';
import Comments from '../../components/common/Comments/Comments';
import ImageViewer from '../../components/common/ImageViewer/ImageViewer';
import styles from './ArticlesPage.module.css';


const formatAudioTime = (value) => {
  const totalSeconds = Math.max(
    0,
    Math.floor(Number(value) || 0)
  );

  const minutes = Math.floor(
    totalSeconds / 60
  );

  const seconds =
    totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};


export default function ArticlePage() {
  const { slug } = useParams();

  const [article, setArticle] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  const [
    showComments,
    setShowComments,
  ] = useState(false);

  const [
    commentCount,
    setCommentCount,
  ] = useState(0);

  const [viewer, setViewer] =
    useState(null);

  const [
    selectedVoiceType,
    setSelectedVoiceType,
  ] = useState('female');

  const [
    isAudioPlaying,
    setIsAudioPlaying,
  ] = useState(false);

  const [
    audioCurrentTime,
    setAudioCurrentTime,
  ] = useState(0);

  const [
    audioDuration,
    setAudioDuration,
  ] = useState(0);

  const [
    playbackRate,
    setPlaybackRate,
  ] = useState(1);

  const bodyRef = useRef(null);
  const audioRef = useRef(null);


  useEffect(() => {
    setLoading(true);
    setError(null);

    getArticle(slug)
      .then(setArticle)
      .catch(() => setError(true))
      .finally(() =>
        setLoading(false)
      );
  }, [slug]);


  const loadCommentCount =
    useCallback(async () => {
      if (!article?.id) return;

      try {
        const data =
          await getComments(article.id);

        const totalCount =
          (data || []).reduce(
            (accumulator, item) => {
              return (
                accumulator +
                1 +
                (item.replies?.length || 0)
              );
            },
            0
          );

        setCommentCount(totalCount);
      } catch {
        // No bloqueamos el artículo.
      }
    }, [article?.id]);


  useEffect(() => {
    if (!article?.id) return undefined;

    loadCommentCount();

    const interval = setInterval(
      loadCommentCount,
      2500
    );

    return () =>
      clearInterval(interval);
  }, [
    article?.id,
    loadCommentCount,
  ]);


  useEffect(() => {
    const bodyElement =
      bodyRef.current;

    if (!bodyElement || !article) {
      return undefined;
    }

    const images = Array.from(
      bodyElement.querySelectorAll('img')
    );

    const cleanups = [];

    images.forEach(image => {
      image.style.cursor = 'zoom-in';

      const handleImageClick = event => {
        const parentLink =
          image.closest('a');

        if (
          parentLink &&
          (
            event.ctrlKey ||
            event.metaKey
          )
        ) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        setViewer({
          src:
            image.currentSrc ||
            image.src,

          alt:
            image.alt ||
            '',
        });
      };

      image.addEventListener(
        'click',
        handleImageClick
      );

      cleanups.push(() => {
        image.removeEventListener(
          'click',
          handleImageClick
        );
      });
    });

    return () => {
      cleanups.forEach(cleanup =>
        cleanup()
      );
    };
  }, [article]);


  const maleAudioUrl =
    article?.audio_male_url || '';

  const femaleAudioUrl =
    article?.audio_female_url || '';

  const hasMaleAudio =
    Boolean(maleAudioUrl);

  const hasFemaleAudio =
    Boolean(femaleAudioUrl);

  const selectedAudioUrl =
    selectedVoiceType === 'male'
      ? maleAudioUrl
      : femaleAudioUrl;

  const storedDuration =
    selectedVoiceType === 'male'
      ? article?.audio_male_duration
      : article?.audio_female_duration;


  useEffect(() => {
    if (
      selectedVoiceType === 'female' &&
      !hasFemaleAudio &&
      hasMaleAudio
    ) {
      setSelectedVoiceType('male');
    }

    if (
      selectedVoiceType === 'male' &&
      !hasMaleAudio &&
      hasFemaleAudio
    ) {
      setSelectedVoiceType('female');
    }
  }, [
    hasFemaleAudio,
    hasMaleAudio,
    selectedVoiceType,
  ]);


  useEffect(() => {
    const audio =
      audioRef.current;

    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    audio.playbackRate = playbackRate;

    setIsAudioPlaying(false);
    setAudioCurrentTime(0);
    setAudioDuration(
      Number(storedDuration) || 0
    );

    if (selectedAudioUrl) {
      audio.load();
    }
  }, [
    selectedAudioUrl,
    storedDuration,
    playbackRate,
  ]);


  useEffect(() => {
    return () => {
      const audio =
        audioRef.current;

      if (audio) {
        audio.pause();
      }
    };
  }, []);


  const handleVoiceChange = (
    nextVoice
  ) => {
    if (
      nextVoice === 'male' &&
      !hasMaleAudio
    ) {
      return;
    }

    if (
      nextVoice === 'female' &&
      !hasFemaleAudio
    ) {
      return;
    }

    setSelectedVoiceType(nextVoice);
  };


  const handlePlayToggle =
    async () => {
      const audio =
        audioRef.current;

      if (!audio || !selectedAudioUrl) {
        return;
      }

      try {
        if (audio.paused) {
          await audio.play();
        } else {
          audio.pause();
        }
      } catch (playError) {
        console.error(
          'No se pudo reproducir el audio:',
          playError
        );
      }
    };


  const seekAudio = (
    secondsToMove
  ) => {
    const audio =
      audioRef.current;

    if (!audio) return;

    const nextTime = Math.min(
      audio.duration || audioDuration || 0,
      Math.max(
        0,
        audio.currentTime +
        secondsToMove
      )
    );

    audio.currentTime = nextTime;
    setAudioCurrentTime(nextTime);
  };


  const handleProgressChange = (
    event
  ) => {
    const audio =
      audioRef.current;

    if (!audio) return;

    const nextTime = Number(
      event.target.value
    );

    audio.currentTime = nextTime;
    setAudioCurrentTime(nextTime);
  };


  const handleRateChange = (
    event
  ) => {
    const nextRate = Number(
      event.target.value
    );

    setPlaybackRate(nextRate);

    if (audioRef.current) {
      audioRef.current.playbackRate =
        nextRate;
    }
  };


  if (loading) {
    return <ArticleSkeleton />;
  }

  if (error || !article) {
    return <NotFound />;
  }


  const collab =
    article.collaborators;

  const cats =
    article.article_categories
      ?.map(item => item.categories)
      .filter(Boolean) || [];

  const tags =
    article.article_tags || [];

  const hasAnyAudio =
    hasMaleAudio ||
    hasFemaleAudio;


  const renderSocialIcon = (
    network
  ) => {
    const key = String(
      network || ''
    ).toLowerCase();

    if (key === 'instagram') {
      return <FaInstagram size={26} />;
    }

    if (key === 'facebook') {
      return <FaFacebookF size={24} />;
    }

    if (key === 'youtube') {
      return <FaYoutube size={26} />;
    }

    if (key === 'tiktok') {
      return <FaTiktok size={24} />;
    }

    if (key === 'website') {
      return <FaGlobe size={24} />;
    }

    if (
      key === 'twitter' ||
      key === 'x'
    ) {
      return (
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    }

    return <FaLink size={24} />;
  };


  const socialEntries =
    Object.entries(
      collab?.social_links || {}
    ).filter(([, url]) =>
      Boolean(url)
    );


  return (
    <div className={styles.page}>
      <motion.header
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
        }}
        className={styles.header}
      >
        <div className={styles.headerInner}>
          <Link
            to="/"
            className={styles.back}
          >
            <ArrowLeft size={14} />
            Inicio
          </Link>

          {cats.length > 0 && (
            <div
              className={styles.categories}
            >
              {cats.map(
                (category, index) => (
                  <Link
                    key={
                      category.id ||
                      category.slug ||
                      `${category.name}-${index}`
                    }
                    to={`/categoria/${category.slug}`}
                    className={styles.categoryTag}
                  >
                    {category.name}
                  </Link>
                )
              )}
            </div>
          )}

          <h1 className={styles.title}>
            {article.title}
          </h1>

          {article.subtitle && (
            <p className={styles.subtitle}>
              {article.subtitle}
            </p>
          )}

          <div className={styles.meta}>
            {collab && (
              <Link
                to={`/colaborador/${collab.slug}`}
                className={styles.author}
              >
                {collab.photo_url && (
                  <img
                    src={collab.photo_url}
                    alt={collab.name}
                    className={styles.authorAvatar}
                  />
                )}

                <span>{collab.name}</span>

                {collab.section_name && (
                  <span
                    className={styles.authorSection}
                  >
                    · {collab.section_name}
                  </span>
                )}
              </Link>
            )}

            <div className={styles.metaRight}>
              <span
                className={styles.publishDate}
              >
                {formatDate(
                  article.published_at
                )}
              </span>

              {hasAnyAudio && (
                <>
                  <span className={styles.dot}>
                    ·
                  </span>

                  <div
                    className={styles.speechControls}
                  >
                    <button
                      type="button"
                      className={`
                        ${styles.speechPlayButton}
                        ${
                          isAudioPlaying
                            ? styles.speechPlayButtonActive
                            : ''
                        }
                      `}
                      onClick={handlePlayToggle}
                      title={
                        isAudioPlaying
                          ? 'Pausar'
                          : 'Escuchar artículo'
                      }
                      aria-label={
                        isAudioPlaying
                          ? 'Pausar narración'
                          : 'Reproducir narración'
                      }
                    >
                      {isAudioPlaying ? (
                        <Pause size={13} />
                      ) : (
                        <Play size={13} />
                      )}
                    </button>

                    <div
                      className={styles.speechVoiceButtons}
                      role="group"
                      aria-label="Seleccionar voz"
                    >
                      <button
                        type="button"
                        className={`
                          ${styles.speechVoiceButton}
                          ${
                            selectedVoiceType === 'male'
                              ? styles.speechVoiceButtonActive
                              : ''
                          }
                        `}
                        onClick={() =>
                          handleVoiceChange('male')
                        }
                        disabled={!hasMaleAudio}
                        title={
                          hasMaleAudio
                            ? 'Voz de Jorge'
                            : 'Voz masculina no disponible'
                        }
                      >
                        <Mars size={15} />
                      </button>

                      <button
                        type="button"
                        className={`
                          ${styles.speechVoiceButton}
                          ${
                            selectedVoiceType === 'female'
                              ? styles.speechVoiceButtonActive
                              : ''
                          }
                        `}
                        onClick={() =>
                          handleVoiceChange('female')
                        }
                        disabled={!hasFemaleAudio}
                        title={
                          hasFemaleAudio
                            ? 'Voz de Dalia'
                            : 'Voz femenina no disponible'
                        }
                      >
                        <Venus size={15} />
                      </button>
                    </div>

                    <button
                      type="button"
                      className={styles.audioSkipButton}
                      onClick={() =>
                        seekAudio(-10)
                      }
                      title="Retroceder 10 segundos"
                    >
                      <RotateCcw size={13} />
                    </button>

                    <button
                      type="button"
                      className={styles.audioSkipButton}
                      onClick={() =>
                        seekAudio(10)
                      }
                      title="Adelantar 10 segundos"
                    >
                      <RotateCw size={13} />
                    </button>

                    <div
                      className={styles.speechDuration}
                    >
                      <Clock size={12} />

                      <span>
                        {formatAudioTime(
                          audioCurrentTime
                        )}
                        {' / '}
                        {formatAudioTime(
                          audioDuration ||
                          storedDuration
                        )}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {hasAnyAudio && (
            <div className={styles.audioProgressRow}>
              <input
                type="range"
                min="0"
                max={
                  audioDuration ||
                  storedDuration ||
                  0
                }
                step="0.1"
                value={Math.min(
                  audioCurrentTime,
                  audioDuration ||
                  storedDuration ||
                  0
                )}
                onChange={handleProgressChange}
                className={styles.audioProgress}
                aria-label="Posición de la narración"
              />

              <select
                value={playbackRate}
                onChange={handleRateChange}
                className={styles.audioRate}
                aria-label="Velocidad de reproducción"
              >
                <option value="0.75">
                  0.75×
                </option>

                <option value="1">
                  1×
                </option>

                <option value="1.25">
                  1.25×
                </option>

                <option value="1.5">
                  1.5×
                </option>
              </select>
            </div>
          )}

          <audio
            ref={audioRef}
            src={selectedAudioUrl || undefined}
            preload="metadata"
            onPlay={() =>
              setIsAudioPlaying(true)
            }
            onPause={() =>
              setIsAudioPlaying(false)
            }
            onEnded={() => {
              setIsAudioPlaying(false);
              setAudioCurrentTime(0);
            }}
            onTimeUpdate={event =>
              setAudioCurrentTime(
                event.currentTarget.currentTime
              )
            }
            onLoadedMetadata={event => {
              const duration =
                event.currentTarget.duration;

              if (
                Number.isFinite(duration)
              ) {
                setAudioDuration(duration);
              }

              event.currentTarget.playbackRate =
                playbackRate;
            }}
          />
        </div>
      </motion.header>

      <div className={styles.meander} />

      {article.cover_image_url && (
        <motion.div
          initial={{
            opacity: 0,
            scale: 1.02,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            duration: 0.6,
            delay: 0.1,
          }}
          className={styles.coverWrap}
          onClick={() =>
            setViewer({
              src: article.cover_image_url,
              alt: article.title,
            })
          }
        >
          <img
            src={article.cover_image_url}
            alt={article.title}
            className={styles.cover}
          />

          <div
            className={styles.coverExpand}
          >
            <Maximize2 size={18} />
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
          delay: 0.2,
        }}
        className={styles.article}
      >
        {article.content_html && (
          <div
            ref={bodyRef}
            className={styles.body}
            dangerouslySetInnerHTML={{
              __html:
                article.content_html,
            }}
          />
        )}

        {tags.length > 0 && (
          <div className={styles.tags}>
            {tags.map((tag, index) => (
              <span
                key={
                  tag.id ||
                  `${tag.tag}-${tag.tag_type || 'tag'}-${index}`
                }
                className={styles.tag}
              >
                {tag.tag_type && (
                  <span
                    className={styles.tagType}
                  >
                    {tag.tag_type}
                  </span>
                )}

                {tag.tag}
              </span>
            ))}
          </div>
        )}

        {collab && (
          <motion.div
            initial={{
              opacity: 0,
              y: 16,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.4,
            }}
            className={styles.authorCard}
          >
            <Link
              to={`/colaborador/${collab.slug}`}
              className={styles.authorCardMain}
            >
              <div
                className={styles.authorCardAvatarWrap}
              >
                {collab.photo_url ? (
                  <img
                    src={collab.photo_url}
                    alt={collab.name}
                    className={styles.authorCardAvatar}
                  />
                ) : (
                  <div
                    className={styles.authorCardAvatarFallback}
                  >
                    {collab.name
                      ?.[0]
                      ?.toUpperCase()}
                  </div>
                )}
              </div>

              <div
                className={styles.authorCardInfo}
              >
                <div
                  className={styles.authorCardLabel}
                >
                  Sobre el autor
                </div>

                <div
                  className={styles.authorCardName}
                >
                  {collab.name}
                </div>

                {collab.section_name && (
                  <div
                    className={styles.authorCardSection}
                  >
                    {collab.section_name}
                  </div>
                )}

                {collab.bio && (
                  <p
                    className={styles.authorCardBio}
                  >
                    {collab.bio}
                  </p>
                )}
              </div>
            </Link>

            {socialEntries.length > 0 && (
              <div
                className={styles.authorSocials}
              >
                {socialEntries.map(
                  ([network, url], index) => (
                    <a
                      key={`${network}-${index}`}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.socialIconLink}
                      aria-label={network}
                      title={network}
                      onClick={event =>
                        event.stopPropagation()
                      }
                    >
                      {renderSocialIcon(network)}
                    </a>
                  )
                )}
              </div>
            )}
          </motion.div>
        )}

        <div className={styles.actionsBar}>
          <LikeButton
            articleId={article.id}
          />

          <button
            className={`
              ${styles.actionIcon}
              ${
                showComments
                  ? styles.actionIconActive
                  : ''
              }
            `}
            onClick={() =>
              setShowComments(previous =>
                !previous
              )
            }
            title="Comentarios"
          >
            <span
              className={styles.actionIconWrap}
            >
              <MessageCircle size={22} />
            </span>

            <span
              className={styles.actionCount}
            >
              {commentCount}
            </span>
          </button>

          <ShareButtons
            article={article}
          />
        </div>

        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                height: 'auto',
              }}
              exit={{
                opacity: 0,
                height: 0,
              }}
              transition={{
                duration: 0.3,
                ease: 'easeInOut',
              }}
              style={{
                overflow: 'hidden',
              }}
            >
              <Comments
                articleId={article.id}
                onCountChange={
                  setCommentCount
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {viewer && (
        <ImageViewer
          src={viewer.src}
          alt={viewer.alt}
          onClose={() =>
            setViewer(null)
          }
        />
      )}
    </div>
  );
}


function ArticleSkeleton() {
  return (
    <div
      style={{
        padding: '48px 24px',
        maxWidth: 760,
        margin: '0 auto',
      }}
    >
      {[300, 500, 60, 400, 400, 200]
        .map((width, index) => (
          <div
            key={index}
            style={{
              height:
                index === 1
                  ? 48
                  : 20,

              width:
                `${Math.min(width, 700)}px`,

              maxWidth: '100%',

              background:
                'var(--color-gray-200)',

              borderRadius: 4,
              marginBottom: 16,
            }}
          />
        ))}
    </div>
  );
}


function NotFound() {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '96px 24px',
      }}
    >
      <div
        style={{
          fontFamily:
            'var(--font-display)',

          fontSize: 64,

          color:
            'var(--color-gray-300)',
        }}
      >
        Λ
      </div>

      <h2
        style={{
          fontFamily:
            'var(--font-display)',

          fontSize: 28,
          marginBottom: 16,
        }}
      >
        Artículo no encontrado
      </h2>

      <Link
        to="/"
        style={{
          color:
            'var(--color-accent)',

          fontFamily:
            'var(--font-sans)',
        }}
      >
        Volver al inicio
      </Link>
    </div>
  );
}
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
  ChevronDown,
  ChevronUp,
  Clock,
  Headphones,
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

import {
  SiSubstack,
} from 'react-icons/si';

import LikeButton from '../../components/common/LikeButton/LikeButton';
import ShareButtons from '../../components/common/ShareButtons/ShareButtons';
import Comments from '../../components/common/Comments/Comments';
import ImageViewer from '../../components/common/ImageViewer/ImageViewer';
import agoraIcon from '../../assets/ICON.png';
import styles from './ArticlePage.module.css';


const AGORA_SOCIAL_LINKS = {
  instagram:
    'https://www.instagram.com/agora_revista/',

  facebook:
    'https://facebook.com/agorarevista',

  youtube:
    'https://www.youtube.com/@agorarevistamx',

  substack:
    'https://agorarevista.substack.com',
};


const AGORA_AUTHOR = {
  name: 'Redacción Agorá',
  slug: null,
  photo_url: agoraIcon,
  section_name: null,
  bio: null,
  social_links: AGORA_SOCIAL_LINKS,
  is_agora: true,
};


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

  const [
    isAudioPanelOpen,
    setIsAudioPanelOpen,
  ] = useState(false);

  const bodyRef = useRef(null);
  const audioRef = useRef(null);


  useEffect(() => {
    setLoading(true);
    setError(null);
    setIsAudioPanelOpen(false);
    setIsAudioPlaying(false);
    setAudioCurrentTime(0);

    getArticle(slug)
      .then(setArticle)
      .catch((requestError) => {
        console.error(
          'Error cargando artículo:',
          requestError
        );

        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);


  const loadCommentCount =
    useCallback(async () => {
      if (!article?.id) {
        return;
      }

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
        // No bloqueamos el artículo si falla
        // únicamente el contador de comentarios.
      }
    }, [article?.id]);


  useEffect(() => {
    if (!article?.id) {
      return;
    }

    loadCommentCount();
  }, [
    article?.id,
    loadCommentCount,
  ]);


  // Permite abrir las imágenes del artículo
  // sin modificar su estructura HTML.
  useEffect(() => {
    const bodyElement =
      bodyRef.current;

    if (!bodyElement || !article) {
      return undefined;
    }

    const images = Array.from(
      bodyElement.querySelectorAll('img')
    );

    const cleanupFunctions = [];

    images.forEach((image) => {
      image.style.cursor = 'zoom-in';

      const handleImageClick = (event) => {
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

      cleanupFunctions.push(() => {
        image.removeEventListener(
          'click',
          handleImageClick
        );
      });
    });

    return () => {
      cleanupFunctions.forEach(
        cleanup => cleanup()
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

  const hasAnyAudio =
    hasMaleAudio ||
    hasFemaleAudio;

  const selectedAudioUrl =
    selectedVoiceType === 'male'
      ? maleAudioUrl
      : femaleAudioUrl;

  const playableAudioUrl =
    isAudioPanelOpen
      ? selectedAudioUrl
      : '';

  const storedAudioDuration =
    selectedVoiceType === 'male'
      ? article?.audio_male_duration
      : article?.audio_female_duration;


  // Selecciona automáticamente la voz disponible.
  useEffect(() => {
    if (
      selectedVoiceType === 'female' &&
      !hasFemaleAudio &&
      hasMaleAudio
    ) {
      setSelectedVoiceType('male');
      return;
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


  // Reinicia el reproductor únicamente cuando
  // el panel está abierto y cambia la voz.
  useEffect(() => {
    const audio =
      audioRef.current;

    setIsAudioPlaying(false);
    setAudioCurrentTime(0);

    setAudioDuration(
      Number(storedAudioDuration) || 0
    );

    if (
      !audio ||
      !isAudioPanelOpen
    ) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    audio.playbackRate = playbackRate;

    if (selectedAudioUrl) {
      audio.load();
    }
  }, [
    isAudioPanelOpen,
    selectedAudioUrl,
    storedAudioDuration,
  ]);


  // Detiene la reproducción al abandonar
  // la página del artículo.
  useEffect(() => {
    return () => {
      const audio =
        audioRef.current;

      if (audio) {
        audio.pause();
      }
    };
  }, []);


  const handleAudioPanelToggle = () => {
    setIsAudioPanelOpen(
      previous => {
        const nextValue =
          !previous;

        if (
          previous &&
          audioRef.current
        ) {
          audioRef.current.pause();
          setIsAudioPlaying(false);
        }

        return nextValue;
      }
    );
  };


  const handleVoiceChange = (
    nextVoiceType
  ) => {
    if (
      nextVoiceType ===
      selectedVoiceType
    ) {
      return;
    }

    if (
      nextVoiceType === 'male' &&
      !hasMaleAudio
    ) {
      return;
    }

    if (
      nextVoiceType === 'female' &&
      !hasFemaleAudio
    ) {
      return;
    }

    setSelectedVoiceType(
      nextVoiceType
    );
  };


  const handlePlayToggle =
    async () => {
      const audio =
        audioRef.current;

      if (
        !audio ||
        !selectedAudioUrl
      ) {
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

    if (!audio) {
      return;
    }

    const maximumDuration =
      Number.isFinite(audio.duration)
        ? audio.duration
        : (
            audioDuration ||
            Number(storedAudioDuration) ||
            0
          );

    const nextTime = Math.min(
      maximumDuration,
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

    if (!audio) {
      return;
    }

    const nextTime = Number(
      event.target.value
    );

    if (!Number.isFinite(nextTime)) {
      return;
    }

    audio.currentTime = nextTime;
    setAudioCurrentTime(nextTime);
  };


  const handleRateChange = (
    event
  ) => {
    const nextPlaybackRate = Number(
      event.target.value
    );

    if (
      !Number.isFinite(
        nextPlaybackRate
      )
    ) {
      return;
    }

    setPlaybackRate(
      nextPlaybackRate
    );

    if (audioRef.current) {
      audioRef.current.playbackRate =
        nextPlaybackRate;
    }
  };


  if (loading) {
    return <ArticleSkeleton />;
  }

  if (error || !article) {
    return <NotFound />;
  }


  const collab =
    article.collaborators ||
    AGORA_AUTHOR;

  const isAgoraArticle =
    Boolean(collab?.is_agora);

  const cats =
    article.article_categories
      ?.map(item => item.categories)
      .filter(Boolean) || [];

  const tags =
    article.article_tags || [];


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

    if (key === 'substack') {
      return <SiSubstack size={24} />;
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


  const effectiveDuration =
    audioDuration ||
    Number(storedAudioDuration) ||
    0;


  return (
    <div className={styles.page}>
      {/* ── Cabecera ─────────────────────────────── */}
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
            <div className={styles.categories}>
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
                to={
                  isAgoraArticle
                    ? '/quienes-somos'
                    : `/colaborador/${collab.slug}`
                }
                className={styles.author}
              >
                {collab.photo_url && (
                  <img
                    src={collab.photo_url}
                    alt={collab.name}
                    className={`${styles.authorAvatar} ${
                      isAgoraArticle
                        ? styles.authorAvatarAgora
                        : ''
                    }`}
                  />
                )}

                <span>
                  {collab.name}
                </span>

                {collab.section_name && (
                  <span
                    className={
                      styles.authorSection
                    }
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

                  <button
                    type="button"
                    className={`
                      ${styles.audioFolderButton}
                      ${
                        isAudioPanelOpen
                          ? styles.audioFolderButtonOpen
                          : ''
                      }
                    `}
                    onClick={
                      handleAudioPanelToggle
                    }
                    aria-expanded={
                      isAudioPanelOpen
                    }
                    aria-controls="article-audio-panel"
                  >
                    <Headphones size={15} />

                    <span>
                      Escuchar artículo
                    </span>

                    <span
                      className={
                        styles.audioFolderDuration
                      }
                    >
                      {formatAudioTime(
                        Number(
                          storedAudioDuration
                        ) || 0
                      )}
                    </span>

                    {isAudioPanelOpen ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {hasAnyAudio && isAudioPanelOpen && (
              <motion.div
                id="article-audio-panel"
                className={
                  styles.audioPlayerPanel
                }
                initial={{
                  opacity: 0,
                  height: 0,
                  y: -6,
                }}
                animate={{
                  opacity: 1,
                  height: 'auto',
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                  y: -6,
                }}
                transition={{
                  duration: 0.24,
                  ease: 'easeOut',
                }}
              >
                <div
                  className={
                    styles.audioPlayerTop
                  }
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
                        ? 'Pausar narración'
                        : 'Escuchar artículo'
                    }
                    aria-label={
                      isAudioPlaying
                        ? 'Pausar narración'
                        : 'Reproducir narración'
                    }
                  >
                    {isAudioPlaying ? (
                      <Pause size={15} />
                    ) : (
                      <Play size={15} />
                    )}
                  </button>

                  <div
                    className={
                      styles.speechVoiceButtons
                    }
                    role="group"
                    aria-label="Seleccionar voz de narración"
                  >
                    <button
                      type="button"
                      className={`
                        ${styles.speechVoiceButton}
                        ${
                          selectedVoiceType ===
                          'male'
                            ? styles.speechVoiceButtonActive
                            : ''
                        }
                      `}
                      onClick={() =>
                        handleVoiceChange(
                          'male'
                        )
                      }
                      disabled={!hasMaleAudio}
                      aria-label="Seleccionar voz de Jorge"
                      title={
                        hasMaleAudio
                          ? 'Jorge — voz masculina'
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
                          selectedVoiceType ===
                          'female'
                            ? styles.speechVoiceButtonActive
                            : ''
                        }
                      `}
                      onClick={() =>
                        handleVoiceChange(
                          'female'
                        )
                      }
                      disabled={!hasFemaleAudio}
                      aria-label="Seleccionar voz de Dalia"
                      title={
                        hasFemaleAudio
                          ? 'Dalia — voz femenina'
                          : 'Voz femenina no disponible'
                      }
                    >
                      <Venus size={15} />
                    </button>
                  </div>

                  <button
                    type="button"
                    className={
                      styles.audioSkipButton
                    }
                    onClick={() =>
                      seekAudio(-10)
                    }
                    title="Retroceder 10 segundos"
                    aria-label="Retroceder 10 segundos"
                  >
                    <RotateCcw size={14} />
                  </button>

                  <button
                    type="button"
                    className={
                      styles.audioSkipButton
                    }
                    onClick={() =>
                      seekAudio(10)
                    }
                    title="Adelantar 10 segundos"
                    aria-label="Adelantar 10 segundos"
                  >
                    <RotateCw size={14} />
                  </button>

                  <div
                    className={
                      styles.speechDuration
                    }
                  >
                    <Clock size={12} />

                    <span>
                      {formatAudioTime(
                        audioCurrentTime
                      )}
                      {' / '}
                      {formatAudioTime(
                        effectiveDuration
                      )}
                    </span>
                  </div>

                  <select
                    value={playbackRate}
                    onChange={
                      handleRateChange
                    }
                    className={
                      styles.audioRate
                    }
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

                <input
                  type="range"
                  min="0"
                  max={effectiveDuration}
                  step="0.1"
                  value={Math.min(
                    audioCurrentTime,
                    effectiveDuration
                  )}
                  onChange={
                    handleProgressChange
                  }
                  disabled={
                    effectiveDuration <= 0
                  }
                  className={
                    styles.audioProgress
                  }
                  aria-label="Posición de la narración"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <audio
            ref={audioRef}
            src={
              playableAudioUrl ||
              undefined
            }
            preload="none"
            onPlay={() => {
              setIsAudioPlaying(true);
            }}
            onPause={() => {
              setIsAudioPlaying(false);
            }}
            onEnded={() => {
              setIsAudioPlaying(false);
              setAudioCurrentTime(0);
            }}
            onTimeUpdate={(event) => {
              setAudioCurrentTime(
                event.currentTarget.currentTime
              );
            }}
            onLoadedMetadata={(event) => {
              const loadedDuration =
                event.currentTarget.duration;

              if (
                Number.isFinite(
                  loadedDuration
                )
              ) {
                setAudioDuration(
                  loadedDuration
                );
              }

              event.currentTarget.playbackRate =
                playbackRate;
            }}
            onError={(event) => {
              console.error(
                'Error cargando narración:',
                event.currentTarget.error
              );

              setIsAudioPlaying(false);
            }}
          />
        </div>
      </motion.header>

      <div className={styles.meander} />

      {/* ── Portada ──────────────────────────────── */}
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
          onClick={() => {
            setViewer({
              src:
                article.cover_image_url,

              alt:
                article.title,
            });
          }}
        >
          <img
            src={article.cover_image_url}
            alt={article.title}
            className={styles.cover}
          />

          <div className={styles.coverExpand}>
            <Maximize2 size={18} />
          </div>
        </motion.div>
      )}

      {/* ── Contenido ────────────────────────────── */}
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
            {tags.map(
              (tag, index) => (
                <span
                  key={
                    tag.id ||
                    `${tag.tag}-${tag.tag_type || 'tag'}-${index}`
                  }
                  className={styles.tag}
                >
                  {tag.tag_type && (
                    <span
                      className={
                        styles.tagType
                      }
                    >
                      {tag.tag_type}
                    </span>
                  )}

                  {tag.tag}
                </span>
              )
            )}
          </div>
        )}

        {/* ── Autor ─────────────────────────────── */}
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
              to={
                isAgoraArticle
                  ? '/quienes-somos'
                  : `/colaborador/${collab.slug}`
              }
              className={
                styles.authorCardMain
              }
            >
              <div
                className={
                  styles.authorCardAvatarWrap
                }
              >
                {collab.photo_url ? (
                  <img
                    src={collab.photo_url}
                    alt={collab.name}
                    className={`${styles.authorCardAvatar} ${
                      isAgoraArticle
                        ? styles.authorCardAvatarAgora
                        : ''
                    }`}
                  />
                ) : (
                  <div
                    className={
                      styles.authorCardAvatarFallback
                    }
                  >
                    {collab.name?.[0]
                      ?.toUpperCase()}
                  </div>
                )}
              </div>

              <div
                className={
                  styles.authorCardInfo
                }
              >
                <div
                  className={
                    styles.authorCardLabel
                  }
                >
                  {isAgoraArticle
                    ? 'Sobre la revista'
                    : 'Sobre el autor'}
                </div>

                <div
                  className={
                    styles.authorCardName
                  }
                >
                  {collab.name}
                </div>

                {collab.section_name && (
                  <div
                    className={
                      styles.authorCardSection
                    }
                  >
                    {collab.section_name}
                  </div>
                )}

                {collab.bio && (
                  <p
                    className={
                      styles.authorCardBio
                    }
                  >
                    {collab.bio}
                  </p>
                )}
              </div>
            </Link>

            {socialEntries.length > 0 && (
              <div
                className={
                  styles.authorSocials
                }
              >
                {socialEntries.map(
                  (
                    [network, url],
                    index
                  ) => (
                    <a
                      key={
                        `${network}-${index}`
                      }
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={
                        styles.socialIconLink
                      }
                      aria-label={network}
                      title={network}
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                    >
                      {renderSocialIcon(
                        network
                      )}
                    </a>
                  )
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Acciones ───────────────────────────── */}
        <div className={styles.actionsBar}>
          <LikeButton
            articleId={article.id}
          />

          <button
            type="button"
            className={`
              ${styles.actionIcon}
              ${
                showComments
                  ? styles.actionIconActive
                  : ''
              }
            `}
            onClick={() => {
              setShowComments(
                previous =>
                  !previous
              );
            }}
            title="Comentarios"
          >
            <span
              className={
                styles.actionIconWrap
              }
            >
              <MessageCircle size={22} />
            </span>

            <span
              className={
                styles.actionCount
              }
            >
              {commentCount}
            </span>
          </button>

          <ShareButtons
            article={article}
          />
        </div>

        {/* ── Comentarios ────────────────────────── */}
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

      {/* ── Visor de imágenes ────────────────────── */}
      {viewer && (
        <ImageViewer
          src={viewer.src}
          alt={viewer.alt}
          onClose={() => {
            setViewer(null);
          }}
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
      {[
        300,
        500,
        60,
        400,
        400,
        200,
      ].map((width, index) => (
        <div
          key={index}
          style={{
            height:
              index === 1
                ? 48
                : 20,

            width:
              `${Math.min(
                width,
                700
              )}px`,

            maxWidth:
              '100%',

            background:
              'var(--color-gray-200)',

            borderRadius:
              4,

            marginBottom:
              16,
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

          fontSize:
            64,

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

          fontSize:
            28,

          marginBottom:
            16,
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
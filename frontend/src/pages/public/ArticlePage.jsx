import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getArticle } from '../../api/articles.api';
import { getComments } from '../../api/comments.api';
import { formatDate } from '../../utils/formatDate';
import {
  Clock,
  ArrowLeft,
  MessageCircle,
  Maximize2,
  Play,
  Pause,
  Mars,
  Venus
} from 'lucide-react';
import {
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaTiktok,
  FaGlobe,
  FaLink
} from 'react-icons/fa6';
import LikeButton from '../../components/common/LikeButton/LikeButton';
import ShareButtons from '../../components/common/ShareButtons/ShareButtons';
import Comments from '../../components/common/Comments/Comments';
import ImageViewer from '../../components/common/ImageViewer/ImageViewer';
import styles from './ArticlePage.module.css';

const FEMALE_VOICE_HINTS = [
  'female',
  'mujer',
  'sabina',
  'helena',
  'laura',
  'dalia',
  'monica',
  'mónica',
  'paulina',
  'marisol',
  'sofia',
  'sofía',
  'elvira',
  'luciana',
  'paloma',
  'ximena',
  'carmen',
  'conchita',
  'lupe',
];

const MALE_VOICE_HINTS = [
  'male',
  'hombre',
  'jorge',
  'pablo',
  'raul',
  'raúl',
  'enrique',
  'alvaro',
  'álvaro',
  'diego',
  'carlos',
  'antonio',
  'andres',
  'andrés',
  'miguel',
  'juan',
  'pedro',
  'marcelo',
];

const cleanArticleTextForSpeech = (html) => {
  if (!html || typeof window === 'undefined') {
    return '';
  }

  const documentFromHtml = new DOMParser().parseFromString(
    html,
    'text/html'
  );

  documentFromHtml
    .querySelectorAll(`
      img,
      picture,
      source,
      video,
      audio,
      iframe,
      embed,
      object,
      figure,
      figcaption,
      script,
      style,
      noscript,
      svg,
      canvas,
      button
    `)
    .forEach(element => element.remove());

  return documentFromHtml.body.textContent
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/www\.\S+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const calculateEstimatedSpeechSeconds = (text) => {
  const words = String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return 0;
  }

  const wordsPerMinute = 155;

  return Math.max(
    1,
    Math.round((words.length / wordsPerMinute) * 60)
  );
};

const formatSpeechDuration = (totalSeconds) => {
  const seconds = Math.max(
    0,
    Math.round(Number(totalSeconds) || 0)
  );

  if (seconds < 60) {
    return `${seconds} s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${remainingSeconds} s`;
};

const selectBrowserVoice = (voices, voiceType) => {
  if (!Array.isArray(voices) || voices.length === 0) {
    return null;
  }

  const spanishVoices = voices.filter(voice =>
    String(voice.lang || '')
      .toLowerCase()
      .startsWith('es')
  );

  const availableVoices =
    spanishVoices.length > 0
      ? spanishVoices
      : voices;

  const hints =
    voiceType === 'male'
      ? MALE_VOICE_HINTS
      : FEMALE_VOICE_HINTS;

  const matchingVoice = availableVoices.find(voice => {
    const searchableName = `${voice.name} ${voice.voiceURI}`
      .toLowerCase();

    return hints.some(hint =>
      searchableName.includes(hint)
    );
  });

  if (matchingVoice) {
    return matchingVoice;
  }

  if (voiceType === 'male' && availableVoices.length > 1) {
    return availableVoices[1];
  }

  return availableVoices[0] || null;
};

export default function ArticlePage() {
  const { slug } = useParams();
  const [article, setArticle]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [viewer, setViewer]             = useState(null); // { src, alt }

  const [speechSupported, setSpeechSupported] = useState(true);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceType, setSelectedVoiceType] = useState('female');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);

  const bodyRef = useRef(null);
  const utteranceRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    getArticle(slug)
      .then(setArticle)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const loadCommentCount = useCallback(async () => {
    if (!article?.id) return;

    try {
      const data = await getComments(article.id);

      const totalCount = (data || []).reduce((acc, item) => {
        return acc + 1 + (item.replies?.length || 0);
      }, 0);

      setCommentCount(totalCount);
    } catch {
    }
  }, [article?.id]);

  useEffect(() => {
    if (!article?.id) return;

    loadCommentCount();

    const interval = setInterval(() => {
      loadCommentCount();
    }, 2500);

    return () => clearInterval(interval);
  }, [article?.id, loadCommentCount]);

  // Abrir imágenes del contenido sin modificar la estructura HTML.
  // Conserva figure, float, caption y enlaces.
  useEffect(() => {
    const bodyElement = bodyRef.current;

    if (!bodyElement || !article) {
      return undefined;
    }

    const images = Array.from(
      bodyElement.querySelectorAll('img')
    );

    const cleanupFunctions = [];

    images.forEach(image => {
      image.style.cursor = 'zoom-in';

      const handleImageClick = event => {
        const parentLink =
          image.closest('a');

        // Ctrl/Cmd + clic conserva el enlace original.
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

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      !('SpeechSynthesisUtterance' in window)
    ) {
      setSpeechSupported(false);
      return undefined;
    }

    const speechSynthesis = window.speechSynthesis;

    const loadVoices = () => {
      const browserVoices = speechSynthesis.getVoices();
      setAvailableVoices(browserVoices);
    };

    loadVoices();

    speechSynthesis.addEventListener(
      'voiceschanged',
      loadVoices
    );

    return () => {
      speechSynthesis.removeEventListener(
        'voiceschanged',
        loadVoices
      );

      speechSynthesis.cancel();
      utteranceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setIsSpeaking(false);
    setIsSpeechPaused(false);
  }, [slug, article?.content_html]);

  const speechText = cleanArticleTextForSpeech(
    article?.content_html
  );

  const estimatedSpeechSeconds =
    calculateEstimatedSpeechSeconds(speechText);

  const estimatedSpeechDuration =
    formatSpeechDuration(estimatedSpeechSeconds);

  const stopSpeech = () => {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setIsSpeaking(false);
    setIsSpeechPaused(false);
  };

  const handleVoiceTypeChange = (nextVoiceType) => {
    if (nextVoiceType === selectedVoiceType) {
      return;
    }

    stopSpeech();
    setSelectedVoiceType(nextVoiceType);
  };

  const handleSpeechToggle = () => {
    if (
      !speechSupported ||
      !speechText ||
      typeof window === 'undefined'
    ) {
      return;
    }

    const speechSynthesis = window.speechSynthesis;

    if (speechSynthesis.speaking) {
      if (speechSynthesis.paused) {
        speechSynthesis.resume();
        setIsSpeechPaused(false);
        setIsSpeaking(true);
      } else {
        speechSynthesis.pause();
        setIsSpeechPaused(true);
      }

      return;
    }

    const selectedVoice = selectBrowserVoice(
      availableVoices,
      selectedVoiceType
    );

    const utterance = new SpeechSynthesisUtterance(
      speechText
    );

    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice?.lang || 'es-MX';
    utterance.rate = 1;
    utterance.pitch =
      selectedVoiceType === 'male'
        ? 0.92
        : 1.05;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsSpeechPaused(false);
    };

    utterance.onpause = () => {
      setIsSpeechPaused(true);
    };

    utterance.onresume = () => {
      setIsSpeaking(true);
      setIsSpeechPaused(false);
    };

    utterance.onend = () => {
      utteranceRef.current = null;
      setIsSpeaking(false);
      setIsSpeechPaused(false);
    };

    utterance.onerror = event => {
      if (event.error !== 'interrupted') {
        console.error(
          'Error al reproducir la narración:',
          event.error
        );
      }

      utteranceRef.current = null;
      setIsSpeaking(false);
      setIsSpeechPaused(false);
    };

    utteranceRef.current = utterance;

    speechSynthesis.cancel();

    window.setTimeout(() => {
      speechSynthesis.speak(utterance);
    }, 100);
  };

  if (loading) return <ArticleSkeleton />;
  if (error)   return <NotFound />;

  const collab = article.collaborators;
  const cats   = article.article_categories?.map(ac => ac.categories).filter(Boolean) || [];
  const tags   = article.article_tags || [];

  const renderSocialIcon = (net) => {
    const key = String(net || '').toLowerCase();

    if (key === 'instagram') return <FaInstagram size={26} />;
    if (key === 'facebook') return <FaFacebookF size={24} />;
    if (key === 'youtube') return <FaYoutube size={26} />;
    if (key === 'tiktok') return <FaTiktok size={24} />;
    if (key === 'website') return <FaGlobe size={24} />;

    if (key === 'twitter' || key === 'x') {
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    }

    return <FaLink size={24} />;
  };
  const socialEntries = Object.entries(collab?.social_links || {}).filter(
    ([, url]) => Boolean(url)
  );

  return (
    <div className={styles.page}>

      {/* ── Cabecera ──────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={styles.header}
      >
        <div className={styles.headerInner}>
          <Link to="/" className={styles.back}>
            <ArrowLeft size={14} /> Inicio
          </Link>

          {cats.length > 0 && (
            <div className={styles.categories}>
              {cats.map((cat, index) => (
                <Link
                  key={cat.id || cat.slug || `${cat.name}-${index}`}
                  to={`/categoria/${cat.slug}`}
                  className={styles.categoryTag}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          <h1 className={styles.title}>{article.title}</h1>

          {article.subtitle && (
            <p className={styles.subtitle}>{article.subtitle}</p>
          )}

          <div className={styles.meta}>
            {collab && (
              <Link to={`/colaborador/${collab.slug}`} className={styles.author}>
                {collab.photo_url && (
                  <img src={collab.photo_url} alt={collab.name} className={styles.authorAvatar} />
                )}
                <span>{collab.name}</span>
                {collab.section_name && (
                  <span className={styles.authorSection}>· {collab.section_name}</span>
                )}
              </Link>
            )}
            <div className={styles.metaRight}>
              <span className={styles.publishDate}>
                {formatDate(article.published_at)}
              </span>

              {speechSupported && speechText && (
                <>
                  <span className={styles.dot}>·</span>

                  <div className={styles.speechControls}>
                    <button
                      type="button"
                      className={`
                        ${styles.speechPlayButton}
                        ${
                          isSpeaking && !isSpeechPaused
                            ? styles.speechPlayButtonActive
                            : ''
                        }
                      `}
                      onClick={handleSpeechToggle}
                      aria-label={
                        isSpeaking && !isSpeechPaused
                          ? 'Pausar lectura del artículo'
                          : isSpeechPaused
                            ? 'Continuar lectura del artículo'
                            : 'Escuchar artículo'
                      }
                      title={
                        isSpeaking && !isSpeechPaused
                          ? 'Pausar'
                          : isSpeechPaused
                            ? 'Continuar'
                            : 'Escuchar artículo'
                      }
                    >
                      {isSpeaking && !isSpeechPaused ? (
                        <Pause size={13} />
                      ) : (
                        <Play size={13} />
                      )}
                    </button>

                    <div
                      className={styles.speechVoiceButtons}
                      role="group"
                      aria-label="Seleccionar voz de lectura"
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
                        onClick={() => handleVoiceTypeChange('male')}
                        aria-label="Seleccionar voz masculina"
                        title="Voz masculina"
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
                        onClick={() => handleVoiceTypeChange('female')}
                        aria-label="Seleccionar voz femenina"
                        title="Voz femenina"
                      >
                        <Venus size={15} />
                      </button>
                    </div>

                    <div
                      className={styles.speechDuration}
                      title="Duración estimada de la narración"
                    >
                      <Clock size={12} />
                      <span>{estimatedSpeechDuration}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      <div className={styles.meander} />

      {/* ── Portada clickeable ─────────────────────────────── */}
      {article.cover_image_url && (
        <motion.div
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={styles.coverWrap}
          onClick={() => setViewer({ src: article.cover_image_url, alt: article.title })}
        >
          <img src={article.cover_image_url} alt={article.title} className={styles.cover} />
          <div className={styles.coverExpand}>
            <Maximize2 size={18} />
          </div>
        </motion.div>
      )}

      {/* ── Artículo centrado ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={styles.article}
      >
        {/* Contenido */}
        {article.content_html && (
          <div
            ref={bodyRef}
            className={styles.body}
            dangerouslySetInnerHTML={{ __html: article.content_html }}
          />
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className={styles.tags}>
            {tags.map((t, index) => (
              <span key={t.id || `${t.tag}-${t.tag_type || 'tag'}-${index}`} className={styles.tag}>
                {t.tag_type && <span className={styles.tagType}>{t.tag_type}</span>}
                {t.tag}
              </span>
            ))}
          </div>
        )}

        {/* Autor card */}
        {collab && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className={styles.authorCard}
          >
            <Link to={`/colaborador/${collab.slug}`} className={styles.authorCardMain}>
              <div className={styles.authorCardAvatarWrap}>
                {collab.photo_url ? (
                  <img
                    src={collab.photo_url}
                    alt={collab.name}
                    className={styles.authorCardAvatar}
                  />
                ) : (
                  <div className={styles.authorCardAvatarFallback}>
                    {collab.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>

              <div className={styles.authorCardInfo}>
                <div className={styles.authorCardLabel}>Sobre el autor</div>

                <div className={styles.authorCardName}>
                  {collab.name}
                </div>

                {collab.section_name && (
                  <div className={styles.authorCardSection}>{collab.section_name}</div>
                )}

                {collab.bio && (
                  <p className={styles.authorCardBio}>{collab.bio}</p>
                )}
              </div>
            </Link>

            {socialEntries.length > 0 && (
              <div className={styles.authorSocials}>
                {socialEntries.map(([net, url], index) => (
                  <a
                    key={`${net}-${index}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialIconLink}
                    aria-label={net}
                    title={net}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {renderSocialIcon(net)}
                  </a>
                ))}
              </div>
            )}
          </motion.div>
        )}
        {/* ── Barra de acciones centrada ─────────────────── */}
        <div className={styles.actionsBar}>
          {/* Like */}
          <LikeButton articleId={article.id} />

          {/* Comentar */}
          <button
            className={`${styles.actionIcon} ${showComments ? styles.actionIconActive : ''}`}
            onClick={() => setShowComments(p => !p)}
            title="Comentarios"
          >
            <span className={styles.actionIconWrap}>
              <MessageCircle size={22} />
            </span>
            <span className={styles.actionCount}>{commentCount}</span>
          </button>

          {/* Compartir */}
          <ShareButtons article={article} />
        </div>

        {/* ── Comentarios (se despliegan) ─────────────────── */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <Comments
                articleId={article.id}
                onCountChange={setCommentCount}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>

      {/* ── Image Viewer ───────────────────────────────────── */}
      {viewer && (
        <ImageViewer
          src={viewer.src}
          alt={viewer.alt}
          onClose={() => setViewer(null)}
        />
      )}

    </div>
  );
}

function ArticleSkeleton() {
  return (
    <div style={{ padding: '48px 24px', maxWidth: 760, margin: '0 auto' }}>
      {[300, 500, 60, 400, 400, 200].map((w, i) => (
        <div key={i} style={{
          height: i === 1 ? 48 : 20,
          width: `${Math.min(w, 700)}px`,
          maxWidth: '100%',
          background: 'var(--color-gray-200)',
          borderRadius: 4,
          marginBottom: 16,
        }} />
      ))}
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '96px 24px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 64, color: 'var(--color-gray-300)' }}>Λ</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 16 }}>
        Artículo no encontrado
      </h2>
      <Link to="/" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-sans)' }}>
        Volver al inicio
      </Link>
    </div>
  );
}
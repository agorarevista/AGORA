import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getConvocatoria } from '../../api/convocatorias.api';
import { formatDate } from '../../utils/formatDate';
import {
  ArrowLeft, Calendar, Clock, Mail, CheckCircle,
  AlertCircle, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import styles from './ConvocatoriaPage.module.css';

export default function ConvocatoriaPage() {
  const { id }    = useParams();
  const [conv, setConv]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [lightbox, setLightbox] = useState(null); // índice de imagen en galería
  const [sent, setSent]       = useState(false);

  useEffect(() => {
    setLoading(true);
    getConvocatoria(id)
      .then(setConv)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  // Cerrar lightbox con Esc
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') setLightbox(null); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  if (loading) return <ConvSkeleton />;
  if (error || !conv) return <NotFound />;

  const now      = new Date();
  const deadline = conv.closes_at ? new Date(conv.closes_at) : null;
  const isPast   = deadline && deadline < now;
  const isOpen   = conv.is_active && !isPast;
  const daysLeft = deadline && !isPast
    ? Math.ceil((deadline - now) / (1000*60*60*24)) : null;

  const gallery = conv.gallery_images || [];

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(conv.contact_email || 'contactoagorarevista@gmail.com');
  };

  return (
    <div className={styles.page}>

      {/* ── Lightbox ────────────────────────────────────── */}
      {lightbox !== null && gallery[lightbox] && (
        <motion.div
          className={styles.lightbox}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setLightbox(null)}
        >
          <button className={styles.lightboxClose} onClick={() => setLightbox(null)}>
            <X size={20} />
          </button>
          {lightbox > 0 && (
            <button className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
              onClick={e => { e.stopPropagation(); setLightbox(lightbox - 1); }}>
              <ChevronLeft size={24} />
            </button>
          )}
          <img
            src={gallery[lightbox]}
            alt={`galería ${lightbox + 1}`}
            className={styles.lightboxImg}
            onClick={e => e.stopPropagation()}
          />
          {lightbox < gallery.length - 1 && (
            <button className={`${styles.lightboxNav} ${styles.lightboxNext}`}
              onClick={e => { e.stopPropagation(); setLightbox(lightbox + 1); }}>
              <ChevronRight size={24} />
            </button>
          )}
          <div className={styles.lightboxCounter}>{lightbox + 1} / {gallery.length}</div>
        </motion.div>
      )}

      {/* ── Header ──────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.back}><ArrowLeft size={13} /> Inicio</Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <span className={`${styles.statusBadge} ${isOpen ? styles.statusOpen : styles.statusClosed}`}>
              {isOpen ? '● Convocatoria abierta' : '○ Convocatoria cerrada'}
            </span>

            <h1 className={styles.headerTitle}>{conv.title}</h1>
            {conv.subtitle && <p className={styles.headerSubtitle}>{conv.subtitle}</p>}

            <div className={styles.headerMeta}>
              {deadline && (
                <span className={`${styles.metaItem} ${isPast ? styles.metaExpired : styles.metaDeadline}`}>
                  <Calendar size={13} />
                  {isPast
                    ? `Cerró el ${formatDate(conv.closes_at)}`
                    : `Cierra el ${formatDate(conv.closes_at)}`}
                  {daysLeft !== null && !isPast && (
                    <span className={styles.daysLeft}>{daysLeft} día{daysLeft !== 1 ? 's' : ''}</span>
                  )}
                </span>
              )}
              {conv.max_submissions && (
                <span className={styles.metaItem}>
                  <Clock size={13} />
                  Cupo: {conv.max_submissions} participantes
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className={styles.meander} />

      {/* ── Body ────────────────────────────────────────── */}
      <div className={styles.body}>
        <div className={styles.layout}>

          {/* ── Columna izquierda: contenido ─────────────── */}
          <div className={styles.content}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>

              {/* Portada */}
              {conv.cover_image_url && (
                <div className={styles.cover}>
                  <img src={conv.cover_image_url} alt={conv.title} />
                </div>
              )}

              {/* Descripción */}
              {conv.description && (
                <div className={styles.convBody}>{conv.description}</div>
              )}

              {/* Categorías */}
              {conv.categories?.length > 0 && (
                <div className={styles.convSection}>
                  <h3 className={styles.convSectionTitle}>Categorías</h3>
                  <ul className={styles.catList}>
                    {conv.categories.map(c => (
                      <li key={c} className={styles.catItem}>
                        <span className={styles.catBullet}>◆</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requisitos */}
              {conv.requirements && (
                <div className={styles.convSection}>
                  <h3 className={styles.convSectionTitle}>Requisitos de envío</h3>
                  <div className={styles.convBody}>{conv.requirements}</div>
                </div>
              )}

              {/* Premios */}
              {conv.prizes && (
                <div className={styles.convSection}>
                  <h3 className={styles.convSectionTitle}>Premios y reconocimientos</h3>
                  <div className={styles.convBody}>{conv.prizes}</div>
                </div>
              )}

              {/* Galería */}
              {gallery.length > 0 && (
                <div className={styles.convSection}>
                  <h3 className={styles.convSectionTitle}>Bases e información</h3>
                  <div className={styles.gallery}>
                    {gallery.map((url, i) => (
                      <div key={i} className={styles.galleryItem} onClick={() => setLightbox(i)}>
                        <img src={url} alt={`imagen ${i + 1}`} />
                        <div className={styles.galleryOverlay}>Ver</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </motion.div>
          </div>

          {/* ── Columna derecha: cómo participar ─────────── */}
          <div className={styles.sidebar}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>

              {/* Panel de participación */}
              <div className={`${styles.sidePanel} ${isOpen ? styles.sidePanelOpen : styles.sidePanelClosed}`}>
                {!isOpen ? (
                  <div className={styles.closedBox}>
                    <AlertCircle size={28} className={styles.closedIcon} />
                    <h3>Convocatoria cerrada</h3>
                    <p>Ya no se aceptan nuevos envíos. Mantente atento a próximas ediciones.</p>
                  </div>
                ) : (
                  <>
                    {sent ? (
                      <div className={styles.sentBox}>
                        <CheckCircle size={32} className={styles.sentIcon} />
                        <h3>¡Listo!</h3>
                        <p>Recuerda enviar tu trabajo al correo con todos los datos solicitados.</p>
                      </div>
                    ) : (
                      <>
                        <div className={styles.sidePanelHeader}>
                          <span className={styles.sidePanelLabel}>Cómo participar</span>
                        </div>

                        {/* Email */}
                        <div className={styles.emailBox}>
                          <div className={styles.emailLabel}>
                            <Mail size={13} /> Envía tu propuesta a:
                          </div>
                          <div className={styles.emailAddr}>
                            {conv.contact_email || 'contactoagorarevista@gmail.com'}
                          </div>
                         <div className={styles.emailActions}>
  <a
    href={`mailto:${conv.contact_email || 'contactoagorarevista@gmail.com'}?subject=${encodeURIComponent(conv.title)}`}
    className={styles.emailBtn}
  >
    <Mail size={13} /> Abrir correo
  </a>

  <button className={styles.copyBtn} onClick={handleCopyEmail}>
    Copiar
  </button>
</div>
                        </div>

                        {/* Qué incluir */}
                        <div className={styles.includeBox}>
                          <div className={styles.includeTitle}>El correo debe incluir:</div>
                          <ul className={styles.includeList}>
                            <li><CheckCircle size={12} /> Asunto: {conv.title}</li>
                            <li><CheckCircle size={12} /> Nombre completo del autor/autora</li>
                            <li><CheckCircle size={12} /> Breve semblanza (máx. 100 palabras)</li>
                            <li><CheckCircle size={12} /> Fotografía de retrato</li>
                            <li><CheckCircle size={12} /> Ciudad de residencia</li>
                            <li><CheckCircle size={12} /> Usuario de Instagram</li>
                            {conv.categories?.length > 0 && (
                              <li><CheckCircle size={12} /> Categoría de participación</li>
                            )}
                            <li><CheckCircle size={12} /> Tu obra o propuesta</li>
                          </ul>
                        </div>

                        {/* Info de límites */}
                        <div className={styles.limitsBox}>
                          {deadline && !isPast && (
                            <div className={styles.limitItem}>
                              <Calendar size={12} />
                              <span>Fecha límite: <strong>{formatDate(conv.closes_at)}</strong></span>
                            </div>
                          )}
                          {conv.max_file_size_mb && (
                            <div className={styles.limitItem}>
                              <Clock size={12} />
                              <span>Peso máximo por adjunto: <strong>{conv.max_file_size_mb} MB</strong></span>
                            </div>
                          )}
                          {conv.max_submissions && (
                            <div className={styles.limitItem}>
                              <Clock size={12} />
                              <span>Cupo: <strong>{conv.max_submissions} participantes</strong></span>
                            </div>
                          )}
                        </div>

                        <button className={styles.markSentBtn} onClick={() => setSent(true)}>
                          Ya envié mi propuesta →
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Info box */}
              <div className={styles.infoBox}>
                <div className={styles.infoTitle}>Información</div>
                <div className={styles.infoGrid}>
                  {deadline && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Fecha límite</span>
                      <span className={`${styles.infoVal} ${isPast ? styles.infoValDead : ''}`}>
                        {formatDate(conv.closes_at)}
                      </span>
                    </div>
                  )}
                  {conv.categories?.length > 0 && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Categorías</span>
                      <span className={styles.infoVal}>{conv.categories.length}</span>
                    </div>
                  )}
                  {conv.max_submissions && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Cupo máximo</span>
                      <span className={styles.infoVal}>{conv.max_submissions}</span>
                    </div>
                  )}
                  {conv.max_file_size_mb && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Peso máx. archivo</span>
                      <span className={styles.infoVal}>{conv.max_file_size_mb} MB</span>
                    </div>
                  )}
                  {conv.contact_email && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Correo de envío</span>
                      <span className={styles.infoVal} style={{ fontSize: 11, wordBreak: 'break-all' }}>
                        {conv.contact_email}
                      </span>
                    </div>
                  )}
                </div>
              </div>

            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConvSkeleton() {
  return (
    <div style={{ padding: '48px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ height: 180, background: 'var(--color-gray-200)', borderRadius: 4, marginBottom: 28 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
        <div style={{ height: 500, background: 'var(--color-gray-200)', borderRadius: 4 }} />
        <div style={{ height: 400, background: 'var(--color-gray-200)', borderRadius: 4 }} />
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '96px 24px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, color: 'var(--color-gray-300)' }}>Λ</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 16 }}>Convocatoria no encontrada</h2>
      <Link to="/" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-sans)' }}>Volver al inicio</Link>
    </div>
  );
}
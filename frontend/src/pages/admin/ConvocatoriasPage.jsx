import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getConvocatorias, createConvocatoria, updateConvocatoria, deleteConvocatoria
} from '../../api/convocatorias.api';
import { uploadFile } from '../../api/admin.api';
import useAlert   from '../../hooks/useAlert';
import useConfirm from '../../hooks/useConfirm';
import { formatDate } from '../../utils/formatDate';
import { Link } from 'react-router-dom';
import {
  Plus, X, Check, Eye, EyeOff, Upload, Trash2,
  Edit, Calendar, Users, FileText, Image as ImgIcon, Inbox
} from 'lucide-react';
import styles from './ConvocatoriasPage.module.css';

const CATEGORIES = [
  'Poesía',
  'Ficción (cuento o narrativa breve)',
  'No ficción (ensayo, crónica, reflexión, reportaje)',
  'Visual (fotografía o ilustración)',
  'Propuestas híbridas (poesía visual, minificción ilustrada)',
];

const EMPTY_FORM = {
  title: '',
  subtitle: '',
  description: '',
  requirements: '',
  prizes: '',
  categories: [],
  contact_email: 'contactoagorarevista@gmail.com',
  closes_at: '',
  max_submissions: '',
  max_file_size_mb: 10,
  cover_image_url: '',
  gallery_images: [],
  is_active: true,
};

export default function ConvocatoriasPage() {
  const alert   = useAlert();
  const confirm = useConfirm();
  const [convs, setConvs]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [preview, setPreview]   = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setConvs(await getConvocatorias()); }
    catch { alert.error('Error', 'No se pudieron cargar las convocatorias'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const setF = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setPreview(false);
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditing(c.id);
    setForm({
      title:           c.title || '',
      subtitle:        c.subtitle || '',
      description:     c.description || '',
      requirements:    c.requirements || '',
      prizes:          c.prizes || '',
      categories:      c.categories || [],
      contact_email:   c.contact_email || 'contactoagorarevista@gmail.com',
      closes_at:       c.closes_at ? c.closes_at.split('T')[0] : '',
      max_submissions: c.max_submissions || '',
      max_file_size_mb: c.max_file_size_mb || 10,
      cover_image_url: c.cover_image_url || '',
      gallery_images:  c.gallery_images || [],
      is_active:       c.is_active ?? true,
    });
    setPreview(false);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert.warning('Falta el título', 'La convocatoria necesita un título');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        closes_at: form.closes_at ? new Date(form.closes_at + 'T23:59:59').toISOString() : null,
        max_submissions: form.max_submissions ? parseInt(form.max_submissions) : null,
        max_file_size_mb: parseInt(form.max_file_size_mb) || 10,
      };
      if (editing) {
        await updateConvocatoria(editing, payload);
        alert.success('Actualizada', 'Convocatoria actualizada correctamente');
      } else {
        await createConvocatoria(payload);
        alert.success('Creada', 'Convocatoria creada y publicada');
      }
      setShowForm(false);
      load();
    } catch (err) {
      alert.error('Error', err.response?.data?.error || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (c) => {
    try {
      await updateConvocatoria(c.id, { is_active: !c.is_active });
      alert.success(c.is_active ? 'Cerrada' : 'Abierta', `Convocatoria actualizada`);
      load();
    } catch { alert.error('Error', 'No se pudo actualizar'); }
  };

const handleDelete = async (c) => {
  const ok = await confirm({
    type: 'error',
    title: '¿Cerrar esta convocatoria?',
    message: `"${c.title}" se cerrará permanentemente y no recibirá más envíos.`,
    confirmLabel: 'Sí, cerrar',
  });
  if (!ok) return;
    try {
      await deleteConvocatoria(c.id);
      alert.success('Cerrada', 'Convocatoria cerrada');
      load();
    } catch { alert.error('Error', 'No se pudo cerrar'); }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const res = await uploadFile(file, 'convocatorias');
      setF('cover_image_url', res.url);
      alert.success('Imagen subida', 'Portada cargada correctamente');
    } catch { alert.error('Error', 'No se pudo subir la imagen'); }
    finally { setUploadingCover(false); }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingGallery(true);
    try {
      const urls = await Promise.all(files.map(f => uploadFile(f, 'convocatorias').then(r => r.url)));
      setF('gallery_images', [...(form.gallery_images || []), ...urls]);
      alert.success('Imágenes subidas', `${urls.length} imagen(es) agregada(s)`);
    } catch { alert.error('Error', 'No se pudieron subir las imágenes'); }
    finally { setUploadingGallery(false); }
  };

  const removeGalleryImg = (idx) => {
    setF('gallery_images', form.gallery_images.filter((_, i) => i !== idx));
  };

  const toggleCategory = (cat) => {
    const arr = form.categories || [];
    setF('categories', arr.includes(cat) ? arr.filter(c => c !== cat) : [...arr, cat]);
  };

  const now = new Date();
  const active = convs.filter(c => c.is_active && (!c.closes_at || new Date(c.closes_at) > now));
  const closed = convs.filter(c => !c.is_active || (c.closes_at && new Date(c.closes_at) <= now));

  return (
    <div className={styles.page}>

      {/* ── Header ──────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={styles.header}>
        <div>
          <div className={styles.headerLabel}>Editorial</div>
          <h1 className={styles.headerTitle}>Convocatorias</h1>
        </div>
        <button onClick={openNew} className={styles.newBtn}>
          <Plus size={16} /> Nueva convocatoria
        </button>
      </motion.div>

      {/* ── Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <div className={styles.overlay} onClick={() => setShowForm(false)}>
            <motion.div
              className={styles.modal}
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.22 }}
            >
              {/* Modal header */}
              <div className={styles.modalHeader}>
                <h3>{editing ? 'Editar convocatoria' : 'Nueva convocatoria'}</h3>
                <div className={styles.modalHeaderActions}>
                  <button
                    className={`${styles.previewToggle} ${preview ? styles.previewToggleActive : ''}`}
                    onClick={() => setPreview(p => !p)}
                  >
                    <Eye size={14} /> {preview ? 'Editar' : 'Preview'}
                  </button>
                  <button onClick={() => setShowForm(false)} className={styles.modalClose}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Preview */}
              {preview ? (
                <div className={styles.previewWrap}>
                  <PreviewConvocatoria form={form} />
                </div>
              ) : (
                <>
                  <div className={styles.modalBody}>

                    {/* ── SECCIÓN: Identidad ─────────────────────── */}
                    <SectionLabel>Identidad</SectionLabel>

                    <div className={styles.formGrid}>
                      <div className={`${styles.formGroup} ${styles.span2}`}>
                        <label className={styles.label}>Título *</label>
                        <input
                          type="text"
                          value={form.title}
                          onChange={e => setF('title', e.target.value)}
                          className={styles.input}
                          placeholder='ej: Convocatoria Agorá 11 — "La creación en tiempos de fractura"'
                        />
                      </div>
                      <div className={`${styles.formGroup} ${styles.span2}`}>
                        <label className={styles.label}>Subtítulo / bajada</label>
                        <input
                          type="text"
                          value={form.subtitle}
                          onChange={e => setF('subtitle', e.target.value)}
                          className={styles.input}
                          placeholder="Descripción breve que aparece en el header"
                        />
                      </div>
                    </div>

                    {/* ── SECCIÓN: Imagen ────────────────────────── */}
                    <SectionLabel>Imagen de portada y galería</SectionLabel>

                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Portada</label>
                        <div className={styles.imgUploadBox}>
                          {form.cover_image_url ? (
                            <div className={styles.imgPreview}>
                              <img src={form.cover_image_url} alt="Portada" />
                              <button className={styles.imgRemove} onClick={() => setF('cover_image_url', '')}>
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <label className={styles.uploadBtn}>
                              <Upload size={14} />
                              {uploadingCover ? 'Subiendo...' : 'Subir portada'}
                              <input type="file" accept="image/*" onChange={handleCoverUpload} hidden />
                            </label>
                          )}
                          <input
                            type="text"
                            value={form.cover_image_url}
                            onChange={e => setF('cover_image_url', e.target.value)}
                            className={styles.input}
                            placeholder="O pega URL..."
                            style={{ marginTop: 6 }}
                          />
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>Galería de imágenes (flyer, bases, etc.)</label>
                        <label className={styles.uploadBtn}>
                          <ImgIcon size={14} />
                          {uploadingGallery ? 'Subiendo...' : 'Subir imágenes'}
                          <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} hidden />
                        </label>
                        {form.gallery_images?.length > 0 && (
                          <div className={styles.galleryGrid}>
                            {form.gallery_images.map((url, i) => (
                              <div key={i} className={styles.galleryThumb}>
                                <img src={url} alt={`img-${i}`} />
                                <button className={styles.galleryRemove} onClick={() => removeGalleryImg(i)}>
                                  <X size={10} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── SECCIÓN: Contenido ─────────────────────── */}
                    <SectionLabel>Contenido</SectionLabel>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Descripción / cuerpo de la convocatoria *</label>
                      <textarea
                        value={form.description}
                        onChange={e => setF('description', e.target.value)}
                        className={`${styles.textarea} ${styles.textareaLg}`}
                        rows={8}
                        placeholder="Describe la convocatoria, temática, espíritu, a quién va dirigida..."
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Requisitos de envío</label>
                      <textarea
                        value={form.requirements}
                        onChange={e => setF('requirements', e.target.value)}
                        className={styles.textarea}
                        rows={5}
                        placeholder="Qué debe incluir el correo, formatos aceptados, extensión máxima, idioma..."
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Premios y reconocimientos (opcional)</label>
                      <textarea
                        value={form.prizes}
                        onChange={e => setF('prizes', e.target.value)}
                        className={styles.textarea}
                        rows={3}
                        placeholder="Publicación en la edición, difusión en redes, compensación económica..."
                      />
                    </div>

                    {/* ── SECCIÓN: Categorías ────────────────────── */}
                    <SectionLabel>Categorías aceptadas</SectionLabel>

                    <div className={styles.categoriesGrid}>
                      {CATEGORIES.map(cat => (
                        <label key={cat} className={`${styles.catCheck} ${form.categories?.includes(cat) ? styles.catCheckActive : ''}`}>
                          <input
                            type="checkbox"
                            checked={form.categories?.includes(cat)}
                            onChange={() => toggleCategory(cat)}
                          />
                          <span>{cat}</span>
                        </label>
                      ))}
                      {/* Categoría personalizada */}
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="+ Otra categoría (presiona Enter)"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            e.preventDefault();
                            toggleCategory(e.target.value.trim());
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>

                    {/* ── SECCIÓN: Envío y límites ───────────────── */}
                    <SectionLabel>Envío y límites</SectionLabel>

                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Email de recepción *</label>
                        <input
                          type="email"
                          value={form.contact_email}
                          onChange={e => setF('contact_email', e.target.value)}
                          className={styles.input}
                          placeholder="contacto@agorarevista.com"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>Fecha límite de recepción</label>
                        <input
                          type="date"
                          value={form.closes_at}
                          onChange={e => setF('closes_at', e.target.value)}
                          className={styles.input}
                        />
                        <div className={styles.fieldHint}>La convocatoria se cerrará automáticamente en esta fecha</div>
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>Cupo máximo de envíos</label>
                        <input
                          type="number"
                          value={form.max_submissions}
                          onChange={e => setF('max_submissions', e.target.value)}
                          className={styles.input}
                          placeholder="Sin límite"
                          min={1}
                        />
                        <div className={styles.fieldHint}>Se cierra al alcanzar el límite</div>
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>Tamaño máximo de archivo (MB)</label>
                        <input
                          type="number"
                          value={form.max_file_size_mb}
                          onChange={e => setF('max_file_size_mb', e.target.value)}
                          className={styles.input}
                          min={1}
                          max={100}
                        />
                        <div className={styles.fieldHint}>Para adjuntos en el correo de envío</div>
                      </div>
                    </div>

                    {/* ── SECCIÓN: Estado ────────────────────────── */}
                    <SectionLabel>Estado</SectionLabel>

                    <label className={styles.toggleRow}>
                      <div>
                        <div className={styles.toggleLabel}>Convocatoria activa (visible al público)</div>
                        <div className={styles.toggleDesc}>Si está inactiva no aparece en el sitio</div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={form.is_active}
                        onClick={() => setF('is_active', !form.is_active)}
                        className={`${styles.toggle} ${form.is_active ? styles.toggleOn : ''}`}
                      >
                        <span className={styles.toggleThumb} />
                      </button>
                    </label>

                  </div>

                  {/* Footer */}
                  <div className={styles.modalFooter}>
                    <button onClick={() => setShowForm(false)} className={styles.cancelBtn}>Cancelar</button>
                    <button onClick={() => setPreview(true)} className={styles.previewBtn}>
                      <Eye size={14} /> Vista previa
                    </button>
                    <button onClick={handleSave} disabled={saving} className={styles.saveBtn}>
                      <Check size={14} />
                      {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Publicar convocatoria'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Lista activas ────────────────────────────────── */}
      {loading ? <Skeleton /> : (
        <>
          {active.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Abiertas</div>
              <div className={styles.list}>
                {active.map((c, i) => (
                  <ConvRow key={c.id} conv={c} index={i} onEdit={openEdit} onToggle={handleToggle} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}

          {closed.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Cerradas</div>
              <div className={styles.list}>
                {closed.map((c, i) => (
                  <ConvRow key={c.id} conv={c} index={i} onEdit={openEdit} onToggle={handleToggle} onDelete={handleDelete} closed />
                ))}
              </div>
            </div>
          )}

          {convs.length === 0 && (
            <div className={styles.empty}>
              <span>◈</span>
              <p>No hay convocatorias todavía.</p>
              <button onClick={openNew} className={styles.newBtn}>
                <Plus size={14} /> Crear primera convocatoria
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Fila de convocatoria ──────────────────────────────── */
function ConvRow({ conv: c, index, onEdit, onToggle, onDelete, closed }) {
  const now      = new Date();
  const deadline = c.closes_at ? new Date(c.closes_at) : null;
  const isPast   = deadline && deadline < now;
  const daysLeft = deadline && !isPast ? Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`${styles.convRow} ${closed ? styles.convRowClosed : ''}`}
    >
      {c.cover_image_url && (
        <div className={styles.convRowImg}>
          <img src={c.cover_image_url} alt={c.title} />
        </div>
      )}

      <div className={styles.convRowInfo}>
        <div className={styles.convRowTitle}>{c.title}</div>
        {c.subtitle && <div className={styles.convRowSubtitle}>{c.subtitle}</div>}
        <div className={styles.convRowMeta}>
          {deadline && (
            <span className={`${styles.metaPill} ${isPast ? styles.metaPillDead : styles.metaPillOpen}`}>
              <Calendar size={11} />
              {isPast ? `Cerró el ${formatDate(c.closes_at)}` : `Cierra en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`}
            </span>
          )}
          {c.max_submissions && (
            <span className={styles.metaPill}>
              <Users size={11} /> Cupo: {c.max_submissions}
            </span>
          )}
          {c.categories?.length > 0 && (
            <span className={styles.metaPill}>
              <FileText size={11} /> {c.categories.length} categoría{c.categories.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

<div className={styles.convRowActions}>
  <Link to={`/admin/convocatorias/${c.id}/envios`} className={styles.actionBtn} title="Ver envíos">
    <Inbox size={14} />
  </Link>
  <button className={styles.actionBtn} onClick={() => onEdit(c)} title="Editar"><Edit size={14} /></button>
  <button className={styles.actionBtn} onClick={() => onToggle(c)} title={c.is_active ? 'Cerrar' : 'Abrir'}>
    {c.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
  </button>
  <button className={`${styles.actionBtn} ${styles.actionDanger}`} onClick={() => onDelete(c)} title="Eliminar">
    <Trash2 size={14} />
  </button>
</div>
    </motion.div>
  );
}

/* ── Preview ───────────────────────────────────────────── */
function PreviewConvocatoria({ form }) {
  const deadline = form.closes_at ? new Date(form.closes_at + 'T23:59:59') : null;
  const isPast   = deadline && deadline < new Date();

  return (
    <div className={styles.previewInner}>
      <div className={styles.previewBadge}>
        {form.is_active && !isPast ? '● Convocatoria abierta' : '○ Convocatoria cerrada'}
      </div>
      <h1 className={styles.previewTitle}>{form.title || 'Sin título'}</h1>
      {form.subtitle && <p className={styles.previewSubtitle}>{form.subtitle}</p>}

      {deadline && (
        <div className={styles.previewDeadline}>
          <Calendar size={13} />
          Fecha límite: <strong>{formatDate(form.closes_at)}</strong>
        </div>
      )}

      {form.cover_image_url && (
        <img src={form.cover_image_url} alt="Portada" className={styles.previewCover} />
      )}

      {form.description && (
        <div className={styles.previewBody}>{form.description}</div>
      )}

      {form.categories?.length > 0 && (
        <div className={styles.previewSection}>
          <strong>Categorías:</strong>
          <ul>
            {form.categories.map(c => <li key={c}>{c}</li>)}
          </ul>
        </div>
      )}

      {form.requirements && (
        <div className={styles.previewSection}>
          <strong>Requisitos:</strong>
          <p>{form.requirements}</p>
        </div>
      )}

      {form.contact_email && (
        <div className={styles.previewEmail}>
          Envíos al correo: <strong>{form.contact_email}</strong>
        </div>
      )}

      {form.max_submissions && (
        <div className={styles.previewLimit}>Cupo: {form.max_submissions} participantes</div>
      )}

      {form.gallery_images?.length > 0 && (
        <div className={styles.previewGallery}>
          {form.gallery_images.map((url, i) => (
            <img key={i} src={url} alt={`galería-${i}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }) {
  return <div className={styles.sectionDivider}>{children}</div>;
}

function Skeleton() {
  return (
    <div className={styles.skeletonList}>
      {[1,2].map(i => <div key={i} className={styles.skeletonRow} />)}
    </div>
  );
}
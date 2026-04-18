import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getEditions, createEdition, updateEdition, setCurrentEdition } from '../../api/editions.api';
import { uploadFile } from '../../api/admin.api';
import useAlert from '../../hooks/useAlert';
import { Plus, Edit, Star, Upload, X, Check, BookOpen } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';
import styles from './EditionsPage.module.css';

const EMPTY_FORM = {
  number: '', name: '', description: '',
  cover_image_url: '', published_at: '', is_current: false
};

export default function EditionsPage() {
  const alert = useAlert();
  const [editions, setEditions]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setEditions(await getEditions()); }
    catch { alert.error('Error', 'No se pudieron cargar las ediciones'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, number: (editions.length + 1) });
    setShowForm(true);
  };

  const openEdit = (ed) => {
    setEditing(ed.id);
    setForm({
      number: ed.number,
      name: ed.name || '',
      description: ed.description || '',
      cover_image_url: ed.cover_image_url || '',
      published_at: ed.published_at?.split('T')[0] || '',
      is_current: ed.is_current || false,
    });
    setShowForm(true);
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile(file, 'covers');
      setForm(f => ({ ...f, cover_image_url: res.url }));
      alert.success('Portada subida', 'Imagen cargada correctamente');
    } catch { alert.error('Error', 'No se pudo subir la imagen'); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.number) {
      alert.warning('Faltan datos', 'Número y nombre son requeridos');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        number: parseInt(form.number),
        published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
      };
      if (editing) {
        await updateEdition(editing, payload);
        alert.success('Actualizada', 'Edición actualizada');
      } else {
        await createEdition(payload);
        alert.success('Creada', 'Edición creada correctamente');
      }
      setShowForm(false);
      load();
    } catch (err) {
      alert.error('Error', err.response?.data?.error || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleSetCurrent = async (ed) => {
    if (ed.is_current) return;
    if (!window.confirm(`¿Establecer la edición №${ed.number} como la edición actual?`)) return;
    try {
      await setCurrentEdition(ed.id);
      alert.success('Edición actual', `№${ed.number} — ${ed.name} es ahora la edición actual`);
      load();
    } catch { alert.error('Error', 'No se pudo actualizar'); }
  };

  const current    = editions.find(e => e.is_current);
  const historical = editions.filter(e => !e.is_current);

  return (
    <div className={styles.page}>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.header}
      >
        <div>
          <div className={styles.headerLabel}>Revista</div>
          <h1 className={styles.headerTitle}>Ediciones</h1>
        </div>
        <button onClick={openNew} className={styles.newBtn}>
          <Plus size={16} /> Nueva edición
        </button>
      </motion.div>

      {/* Modal */}
      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <motion.div
            className={styles.modal}
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
          >
            <div className={styles.modalHeader}>
              <h3>{editing ? 'Editar edición' : 'Nueva edición'}</h3>
              <button onClick={() => setShowForm(false)} className={styles.modalClose}><X size={18} /></button>
            </div>

            <div className={styles.modalBody}>
              {/* Portada */}
              <div className={styles.coverSection}>
                {form.cover_image_url ? (
                  <div className={styles.coverPreview}>
                    <img src={form.cover_image_url} alt="Portada" />
                    <button className={styles.removeCover} onClick={() => setForm(f => ({ ...f, cover_image_url: '' }))}>
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className={styles.coverEmpty}>
                    <BookOpen size={28} />
                    <span>Sin portada</span>
                  </div>
                )}
                <label className={styles.uploadBtn}>
                  <Upload size={13} />
                  {uploading ? 'Subiendo...' : 'Subir portada'}
                  <input type="file" accept="image/*" onChange={handleCoverUpload} hidden />
                </label>
                <input
                  type="text"
                  value={form.cover_image_url}
                  onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))}
                  className={styles.input}
                  placeholder="O pega URL de portada..."
                />
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Número *</label>
                  <input
                    type="number"
                    value={form.number}
                    onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                    className={styles.input}
                    min={1}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Fecha de publicación</label>
                  <input
                    type="date"
                    value={form.published_at}
                    onChange={e => setForm(f => ({ ...f, published_at: e.target.value }))}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label}>Nombre / Título de la edición *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className={styles.input}
                    placeholder="ej: Voces del norte"
                  />
                </div>

                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label}>Descripción</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className={styles.textarea}
                    rows={3}
                    placeholder="Temática o descripción de la edición..."
                  />
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button onClick={() => setShowForm(false)} className={styles.cancelBtn}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} className={styles.saveBtn}>
                <Check size={14} />
                {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear edición'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edición actual */}
      {current && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.currentCard}
        >
          <div className={styles.currentBadge}>
            <Star size={12} fill="currentColor" /> Edición actual
          </div>
          <div className={styles.currentInner}>
            {current.cover_image_url && (
              <img src={current.cover_image_url} alt="" className={styles.currentCover} />
            )}
            <div className={styles.currentInfo}>
              <div className={styles.currentNumber}>№ {current.number}</div>
              <h2 className={styles.currentName}>{current.name}</h2>
              {current.description && <p className={styles.currentDesc}>{current.description}</p>}
              {current.published_at && (
                <div className={styles.currentDate}>Publicada: {formatDate(current.published_at)}</div>
              )}
            </div>
            <button onClick={() => openEdit(current)} className={styles.editCurrentBtn}>
              <Edit size={14} /> Editar
            </button>
          </div>
        </motion.div>
      )}

      {/* Historial */}
      {loading ? (
        <div className={styles.grid}>
          {[1,2,3].map(i => <div key={i} className={styles.skeletonCard} />)}
        </div>
      ) : historical.length > 0 ? (
        <div className={styles.histSection}>
          <div className={styles.histTitle}>Archivo histórico</div>
          <div className={styles.grid}>
            {historical.map((ed, i) => (
              <motion.div
                key={ed.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={styles.edCard}
              >
                <div className={styles.edCover}>
                  {ed.cover_image_url
                    ? <img src={ed.cover_image_url} alt="" />
                    : <div className={styles.edCoverEmpty}><BookOpen size={24} /></div>
                  }
                </div>
                <div className={styles.edInfo}>
                  <div className={styles.edNumber}>№ {ed.number}</div>
                  <div className={styles.edName}>{ed.name}</div>
                  {ed.published_at && (
                    <div className={styles.edDate}>{formatDate(ed.published_at)}</div>
                  )}
                </div>
                <div className={styles.edActions}>
                  <button
                    className={`${styles.actionBtn} ${styles.actionStar}`}
                    onClick={() => handleSetCurrent(ed)}
                    title="Establecer como actual"
                  >
                    <Star size={13} />
                  </button>
                  <button className={styles.actionBtn} onClick={() => openEdit(ed)} title="Editar">
                    <Edit size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : !current ? (
        <div className={styles.empty}>
          <span>◈</span>
          <p>No hay ediciones todavía. Crea la primera.</p>
        </div>
      ) : null}

    </div>
  );
}
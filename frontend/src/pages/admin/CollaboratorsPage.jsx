import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getCollaborators, createCollaborator, updateCollaborator, deleteCollaborator } from '../../api/collaborators.api';
import { uploadFile } from '../../api/admin.api';
import useAlert from '../../hooks/useAlert';
import { Plus, Edit, Trash2, X, Check, Upload, User } from 'lucide-react';
import styles from './CollaboratorsPage.module.css';

const EMPTY_FORM = {
  name: '',
  bio: '',
  email: '',
  phone: '',
  type: 'occasional',
  section_name: '',
  section_description: '',
  photo_url: '',
  social_links: {
    instagram: '',
    facebook: '',
    twitter: '',
    x: '',
    tiktok: '',
    youtube: '',
    website: '',
    extra_link: '',
  }
};

export default function CollaboratorsPage() {
  const alert = useAlert();
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showForm, setShowForm]           = useState(false);
  const [editing, setEditing]             = useState(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [saving, setSaving]               = useState(false);
  const [uploading, setUploading]         = useState(false);

  const load = async () => {
    setLoading(true);
    try { setCollaborators(await getCollaborators()); }
    catch { alert.error('Error', 'No se pudieron cargar los colaboradores'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditing(c.id);
    setForm({
      name: c.name || '',
      bio: c.bio || '',
      email: c.email || '',
      phone: c.phone || '',
      type: c.type || 'occasional',
      section_name: c.section_name || '',
      section_description: c.section_description || '',
      photo_url: c.photo_url || '',
      social_links: {
        instagram: c.social_links?.instagram || '',
        facebook: c.social_links?.facebook || '',
        twitter: c.social_links?.twitter || '',
        x: c.social_links?.x || '',
        tiktok: c.social_links?.tiktok || '',
        youtube: c.social_links?.youtube || '',
        website: c.social_links?.website || '',
        extra_link: c.social_links?.extra_link || '',
      }
    });
    setShowForm(true);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile(file, 'avatars');
      setForm(f => ({ ...f, photo_url: res.url }));
      alert.success('Foto subida', 'Foto de perfil cargada');
    } catch { alert.error('Error', 'No se pudo subir la foto'); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert.warning('Falta el nombre', 'El colaborador necesita un nombre');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        social_links: Object.fromEntries(
          Object.entries(form.social_links).filter(([_, v]) => v.trim())
        )
      };
      if (editing) {
        await updateCollaborator(editing, payload);
        alert.success('Actualizado', 'Colaborador actualizado');
      } else {
        await createCollaborator(payload);
        alert.success('Creado', 'Colaborador creado correctamente');
      }
      setShowForm(false);
      load();
    } catch (err) {
      alert.error('Error', err.response?.data?.error || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`¿Eliminar a "${c.name}"?`)) return;
    try {
      await deleteCollaborator(c.id);
      alert.success('Eliminado', `"${c.name}" fue eliminado`);
      load();
    } catch { alert.error('Error', 'No se pudo eliminar'); }
  };

  const fixed      = collaborators.filter(c => c.type === 'fixed');
  const occasional = collaborators.filter(c => c.type === 'occasional');

  return (
    <div className={styles.page}>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.header}
      >
        <div>
          <div className={styles.headerLabel}>Comunidad</div>
          <h1 className={styles.headerTitle}>Colaboradores</h1>
        </div>
        <button onClick={openNew} className={styles.newBtn}>
          <Plus size={16} /> Nuevo colaborador
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
              <h3>{editing ? 'Editar colaborador' : 'Nuevo colaborador'}</h3>
              <button onClick={() => setShowForm(false)} className={styles.modalClose}><X size={18} /></button>
            </div>

            <div className={styles.modalBody}>
              {/* Foto */}
              <div className={styles.photoSection}>
                <div className={styles.photoWrap}>
                  {form.photo_url
                    ? <img src={form.photo_url} alt="" className={styles.photoPreview} />
                    : <div className={styles.photoEmpty}><User size={32} /></div>
                  }
                </div>
                <label className={styles.photoBtn}>
                  <Upload size={13} />
                  {uploading ? 'Subiendo...' : 'Subir foto'}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
                </label>
                <input
                  type="text"
                  value={form.photo_url}
                  onChange={e => setForm(f => ({ ...f, photo_url: e.target.value }))}
                  className={styles.input}
                  placeholder="O pega URL de imagen..."
                  style={{ marginTop: 6 }}
                />
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label}>Nombre completo *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className={styles.input}
                    placeholder="Nombre del colaborador"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={styles.input} placeholder="email@ejemplo.com" />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Teléfono</label>
                  <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={styles.input} placeholder="+52 668 000 0000" />
                </div>

                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label}>Tipo de colaborador</label>
                  <div className={styles.typeToggle}>
                    <button
                      type="button"
                      className={`${styles.typeBtn} ${form.type === 'occasional' ? styles.typeBtnActive : ''}`}
                      onClick={() => setForm(f => ({ ...f, type: 'occasional' }))}
                    >
                      Ocasional
                    </button>
                    <button
                      type="button"
                      className={`${styles.typeBtn} ${form.type === 'fixed' ? styles.typeBtnActive : ''}`}
                      onClick={() => setForm(f => ({ ...f, type: 'fixed' }))}
                    >
                      Fijo
                    </button>
                  </div>
                </div>

                {form.type === 'fixed' && (
                  <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                    <label className={styles.label}>Nombre de su sección propia</label>
                    <input
                      type="text"
                      value={form.section_name}
                      onChange={e => setForm(f => ({ ...f, section_name: e.target.value }))}
                      className={styles.input}
                      placeholder="ej: Vórtice, Palabrante, etc."
                    />
                  </div>
                )}

                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label}>Semblanza / Bio</label>
                  <textarea
                    value={form.bio}
                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    className={styles.textarea}
                    rows={3}
                    placeholder="Breve descripción del colaborador..."
                  />
                </div>

                {/* Redes sociales */}
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label}>Redes sociales y enlaces</label>
                  <div className={styles.socialsGrid}>
                    {[
                      { key: 'instagram', label: 'Instagram URL' },
                      { key: 'facebook', label: 'Facebook URL' },
                      { key: 'twitter', label: 'Twitter URL' },
                      { key: 'x', label: 'X URL' },
                      { key: 'tiktok', label: 'TikTok URL' },
                      { key: 'youtube', label: 'YouTube URL' },
                      { key: 'website', label: 'Website URL' },
                      { key: 'extra_link', label: 'Link extra URL' },
                    ].map(({ key, label }) => (
                      <input
                        key={key}
                        type="text"
                        value={form.social_links[key] || ''}
                        onChange={e => setForm(f => ({
                          ...f,
                          social_links: {
                            ...f.social_links,
                            [key]: e.target.value
                          }
                        }))}
                        className={styles.input}
                        placeholder={label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button onClick={() => setShowForm(false)} className={styles.cancelBtn}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} className={styles.saveBtn}>
                <Check size={14} />
                {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear colaborador'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Grids */}
      {loading ? (
        <div className={styles.grid}>
          {[1,2,3,4,5,6].map(i => <div key={i} className={styles.skeletonCard} />)}
        </div>
      ) : (
        <>
          {fixed.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <span className={styles.sectionBadge}>Fijos</span>
                {fixed.length} colaborador{fixed.length !== 1 ? 'es' : ''}
              </div>
              <div className={styles.grid}>
                {fixed.map((c, i) => (
                  <CollabCard key={c.id} collab={c} index={i} onEdit={openEdit} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}

          {occasional.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <span className={styles.sectionBadgeOcc}>Ocasionales</span>
                {occasional.length} colaborador{occasional.length !== 1 ? 'es' : ''}
              </div>
              <div className={styles.grid}>
                {occasional.map((c, i) => (
                  <CollabCard key={c.id} collab={c} index={i} onEdit={openEdit} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}

          {collaborators.length === 0 && (
            <div className={styles.empty}>
              <span>◍</span>
              <p>No hay colaboradores todavía.</p>
              <button onClick={openNew} className={styles.newBtn}>
                <Plus size={14} /> Agregar el primero
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CollabCard({ collab: c, index, onEdit, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={styles.card}
    >
      <div className={styles.cardAvatar}>
        {c.photo_url
          ? <img src={c.photo_url} alt={c.name} />
          : <div className={styles.cardAvatarEmpty}>{c.name?.[0]?.toUpperCase()}</div>
        }
      </div>
      <div className={styles.cardInfo}>
        <div className={styles.cardName}>{c.name}</div>
        {c.section_name && (
          <div className={styles.cardSection}>{c.section_name}</div>
        )}
        {c.bio && (
          <p className={styles.cardBio}>{c.bio}</p>
        )}
      </div>
      <div className={styles.cardActions}>
        <button className={styles.actionBtn} onClick={() => onEdit(c)} title="Editar">
          <Edit size={13} />
        </button>
        <button className={`${styles.actionBtn} ${styles.actionDanger}`} onClick={() => onDelete(c)} title="Eliminar">
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}
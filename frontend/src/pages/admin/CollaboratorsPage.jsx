import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  getCollaborators,
  createCollaborator,
  updateCollaborator,
  deleteCollaborator,
} from '../../api/collaborators.api';

import { getAdminCategories } from '../../api/categories.api.js';
import { uploadFile } from '../../api/admin.api';
import useAlert   from '../../hooks/useAlert';
import useConfirm from '../../hooks/useConfirm';
import Cropper from 'react-easy-crop';
import { Plus, Edit, Trash2, X, Check, Upload, User } from 'lucide-react';
import styles from './CollaboratorsPage.module.css';

const EMPTY_FORM = {
  name: '',
  bio: '',
  email: '',
  phone: '',
  type: 'occasional',

  // Relación real con categories.id
  fixed_category_id: '',

  // Se mantiene por compatibilidad con el backend actual.
  section_name: '',
  section_description: '',

  photo_url: '',
  photo_x: 50,
  photo_y: 20,
  photo_zoom: 1,

  social_links: {
    instagram: '',
    facebook: '',
    twitter: '',
    x: '',
    tiktok: '',
    youtube: '',
    website: '',
    extra_link: '',
  },
};

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

async function getCroppedImageFile(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = 1080;
  canvas.height = 1350;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('No se pudo generar el recorte'));
        return;
      }

      const file = new File([blob], `colaborador-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });

      resolve(file);
    }, 'image/jpeg', 0.92);
  });
}

function parsePhotoCrop(url = '') {
  const cleanUrl = url.split('#crop=')[0];
  const cropRaw = url.split('#crop=')[1];

  if (!cropRaw) {
    return {
      cleanUrl,
      x: 50,
      y: 20,
      zoom: 1,
    };
  }

  const [x, y, zoom] = cropRaw.split(',').map(Number);

  return {
    cleanUrl,
    x: Number.isFinite(x) ? x : 50,
    y: Number.isFinite(y) ? y : 20,
    zoom: Number.isFinite(zoom) ? zoom : 1,
  };
}

function buildPhotoUrl(url, x, y, zoom) {
  const cleanUrl = String(url || '').split('#crop=')[0].trim();
  if (!cleanUrl) return '';
  return `${cleanUrl}#crop=${x},${y},${zoom}`;
}

export default function CollaboratorsPage() {
  const alert   = useAlert();
  const confirm = useConfirm();
  const [collaborators, setCollaborators] = useState([]);
  const [fixedSections, setFixedSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSections, setLoadingSections] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]             = useState(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [saving, setSaving]               = useState(false);
  const [uploading, setUploading]         = useState(false);
  const [cropOpen, setCropOpen]           = useState(false);
  const [cropSrc, setCropSrc]             = useState('');
  const [crop, setCrop]                   = useState({ x: 0, y: 0 });
  const [cropZoom, setCropZoom]           = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropping, setCropping]           = useState(false);

const load = async () => {
  setLoading(true);
  setLoadingSections(true);

  try {
    const [collaboratorData, categoryData] = await Promise.all([
      getCollaborators(),
      getAdminCategories(),
    ]);

    setCollaborators(
      Array.isArray(collaboratorData)
        ? collaboratorData
        : []
    );

    const categoryParents = Array.isArray(categoryData)
      ? categoryData
      : [];

    const columnsFolder = categoryParents.find(
      category =>
        category.slug === 'columnas' ||
        category.name?.trim().toLowerCase() === 'columnas'
    );

    const columnSections = Array.isArray(
      columnsFolder?.subcategories
    )
      ? columnsFolder.subcategories
          .filter(category => category.is_active)
          .sort(
            (a, b) =>
              Number(a.display_order || 0) -
              Number(b.display_order || 0)
          )
      : [];

    setFixedSections(columnSections);
  } catch (error) {
    console.error('ERROR cargando colaboradores:', error);

    alert.error(
      'Error',
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      'No se pudieron cargar los colaboradores'
    );
  } finally {
    setLoading(false);
    setLoadingSections(false);
  }
};

useEffect(() => {
  load();
}, []);

const openNew = () => {
  setEditing(null);

  setForm({
    ...EMPTY_FORM,
    social_links: {
      ...EMPTY_FORM.social_links,
    },
  });

  setShowForm(true);
};

const openEdit = collaborator => {
  const cropData = parsePhotoCrop(
    collaborator.photo_url || ''
  );

  setEditing(collaborator.id);

  setForm({
    name: collaborator.name || '',
    bio: collaborator.bio || '',
    email: collaborator.email || '',
    phone: collaborator.phone || '',
    type: collaborator.type || 'occasional',

    fixed_category_id:
      collaborator.fixed_category_id ||
      collaborator.fixed_category?.id ||
      '',

    section_name:
      collaborator.fixed_category?.name ||
      collaborator.section_name ||
      '',

    section_description:
      collaborator.section_description || '',

    photo_url: cropData.cleanUrl || '',
    photo_x: cropData.x,
    photo_y: cropData.y,
    photo_zoom: cropData.zoom,

    social_links: {
      instagram:
        collaborator.social_links?.instagram || '',
      facebook:
        collaborator.social_links?.facebook || '',
      twitter:
        collaborator.social_links?.twitter || '',
      x:
        collaborator.social_links?.x || '',
      tiktok:
        collaborator.social_links?.tiktok || '',
      youtube:
        collaborator.social_links?.youtube || '',
      website:
        collaborator.social_links?.website || '',
      extra_link:
        collaborator.social_links?.extra_link || '',
    },
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

const onCropComplete = useCallback((_, croppedPixels) => {
  setCroppedAreaPixels(croppedPixels);
}, []);

const openCropper = () => {
  if (!form.photo_url) return;
  setCropSrc(form.photo_url);
  setCrop({ x: 0, y: 0 });
  setCropZoom(1);
  setCropOpen(true);
};

const applyCrop = async () => {
  if (!cropSrc || !croppedAreaPixels) return;

  setCropping(true);

  try {
    const croppedFile = await getCroppedImageFile(cropSrc, croppedAreaPixels);
    const res = await uploadFile(croppedFile, 'avatars');

    setForm(f => ({ ...f, photo_url: res.url }));
    setCropOpen(false);
    alert.success('Foto ajustada', 'El recorte se aplicó correctamente');
  } catch {
    alert.error(
      'Error',
      'No se pudo recortar esta imagen. Si es un link externo, descarga la imagen y súbela directo.'
    );
  } finally {
    setCropping(false);
  }
};

const handleSave = async () => {
  if (
    form.photo_url?.includes('fbcdn.net') ||
    form.photo_url?.includes('cdninstagram.com')
  ) {
    alert.warning(
      'URL no compatible',
      'Las imágenes de Facebook/Instagram se bloquean. Sube la foto directamente o usa un enlace de Cloudflare R2.'
    );
    return;
  }

  if (!form.name.trim()) {
    alert.warning(
      'Falta el nombre',
      'El colaborador necesita un nombre'
    );
    return;
  }

  if (form.type === 'fixed' && !form.fixed_category_id) {
    alert.warning(
      'Falta la columna',
      'Selecciona la columna fija que pertenece a este colaborador'
    );
    return;
  }

  setSaving(true);

  try {
    const selectedCategory = fixedSections.find(
      category => category.id === form.fixed_category_id
    );

    const payload = {
      ...form,

      fixed_category_id:
        form.type === 'fixed'
          ? form.fixed_category_id
          : null,

      section_name:
        form.type === 'fixed'
          ? selectedCategory?.name || ''
          : null,

      section_description:
        form.type === 'fixed'
          ? form.section_description || null
          : null,

      photo_url: buildPhotoUrl(
        form.photo_url,
        form.photo_x,
        form.photo_y,
        form.photo_zoom
      ),

      social_links: Object.fromEntries(
        Object.entries(form.social_links).filter(
          ([, value]) =>
            typeof value === 'string' &&
            value.trim()
        )
      ),
    };

    delete payload.photo_x;
    delete payload.photo_y;
    delete payload.photo_zoom;

    if (editing) {
      await updateCollaborator(editing, payload);

      alert.success(
        'Actualizado',
        'Colaborador y columna actualizados correctamente'
      );
    } else {
      await createCollaborator(payload);

      alert.success(
        'Creado',
        'Colaborador y columna vinculados correctamente'
      );
    }

    setShowForm(false);
    setEditing(null);

    setForm({
      ...EMPTY_FORM,
      social_links: {
        ...EMPTY_FORM.social_links,
      },
    });

    await load();
  } catch (error) {
    console.error(
      'ERROR guardando colaborador:',
      error?.response?.data || error
    );

    alert.error(
      'Error',
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      'No se pudo guardar'
    );
  } finally {
    setSaving(false);
  }
};

const handleDelete = async collaborator => {
  const confirmed =
    await confirm({
      type: 'error',

      title:
        `¿Eliminar permanentemente a "${collaborator.name}"?`,

      message:
        'Esta acción eliminará definitivamente al colaborador. No se podrá recuperar.',

      confirmLabel:
        'Sí, eliminar permanentemente',
    });

  if (!confirmed) {
    return;
  }

  try {
    await deleteCollaborator(
      collaborator.id
    );

    alert.success(
      'Eliminado permanentemente',
      `"${collaborator.name}" fue eliminado del sistema`
    );

    await load();
  } catch (error) {
    console.error(
      'ERROR eliminando colaborador:',
      error?.response?.data ||
      error
    );

    alert.error(
      'No se pudo eliminar',
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      'Ocurrió un error al eliminar el colaborador'
    );
  }
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
  <div className={styles.photoCropPreviewBox}>
    {form.photo_url
      ? <img src={form.photo_url} alt="" className={styles.photoCropPreview} />
      : <div className={styles.photoEmpty}><User size={32} /></div>
    }
  </div>

  <div className={styles.photoActions}>
    <label className={styles.photoBtn}>
      <Upload size={13} />
      {uploading ? 'Subiendo...' : 'Subir foto'}
      <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
    </label>

    {form.photo_url && (
      <button type="button" className={styles.photoBtn} onClick={openCropper}>
        Ajustar encuadre
      </button>
    )}
  </div>

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
                  className={`
                    ${styles.typeBtn}
                    ${form.type === 'occasional'
                      ? styles.typeBtnActive
                      : ''}
                  `}
                  onClick={() =>
                    setForm(current => ({
                      ...current,
                      type: 'occasional',
                      fixed_category_id: '',
                      section_name: '',
                      section_description: '',
                    }))
                  }
                >
                  Ocasional
                </button>

                <button
                  type="button"
                  className={`
                    ${styles.typeBtn}
                    ${form.type === 'fixed'
                      ? styles.typeBtnActive
                      : ''}
                  `}
                  onClick={() =>
                    setForm(current => ({
                      ...current,
                      type: 'fixed',
                    }))
                  }
                >
                  Fijo
                </button>
                  </div>
                </div>

{form.type === 'fixed' && (
  <>
    <div
      className={styles.formGroup}
      style={{ gridColumn: '1 / -1' }}
    >
      <label className={styles.label}>
        Columna fija *
      </label>

      <select
        value={form.fixed_category_id || ''}
        onChange={event => {
          const selectedId = event.target.value;

          const selectedCategory = fixedSections.find(
            category => category.id === selectedId
          );

          setForm(current => ({
            ...current,
            fixed_category_id: selectedId,
            section_name: selectedCategory?.name || '',
          }));
        }}
        className={styles.select}
        disabled={loadingSections}
      >
        <option value="">
          {loadingSections
            ? 'Cargando columnas...'
            : '— Selecciona una columna —'}
        </option>

        {fixedSections.map(category => {
          const occupiedByAnother =
            category.fixed_collaborator_id &&
            category.fixed_collaborator_id !== editing;

          return (
            <option
              key={category.id}
              value={category.id}
              disabled={occupiedByAnother}
            >
              {category.name}
              {occupiedByAnother
                ? ' — ya asignada'
                : ''}
            </option>
          );
        })}
      </select>

      <span className={styles.fieldHelp}>
        Solo aparecen las secciones publicadas dentro de la
        carpeta “Columnas”. Una columna no puede pertenecer a
        dos colaboradores.
      </span>
    </div>

    <div
      className={styles.formGroup}
      style={{ gridColumn: '1 / -1' }}
    >
      <label className={styles.label}>
        Descripción de la columna
      </label>

      <textarea
        value={form.section_description}
        onChange={event =>
          setForm(current => ({
            ...current,
            section_description: event.target.value,
          }))
        }
        className={styles.textarea}
        rows={2}
        placeholder="Descripción breve de la columna..."
      />
    </div>
  </>
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

{cropOpen && (
  <div className={styles.cropModalOverlay} onClick={() => setCropOpen(false)}>
    <div className={styles.cropModal} onClick={e => e.stopPropagation()}>
      <div className={styles.cropHeader}>
        <h4>Ajustar foto</h4>
        <button type="button" onClick={() => setCropOpen(false)}>
          <X size={18} />
        </button>
      </div>

      <div className={styles.cropArea}>
        <Cropper
          image={cropSrc}
          crop={crop}
          zoom={cropZoom}
          aspect={4 / 5}
          onCropChange={setCrop}
          onZoomChange={setCropZoom}
          onCropComplete={onCropComplete}
          showGrid
        />
      </div>

      <div className={styles.cropFooter}>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={cropZoom}
          onChange={e => setCropZoom(Number(e.target.value))}
        />

        <button type="button" className={styles.cancelBtn} onClick={() => setCropOpen(false)}>
          Cancelar
        </button>

        <button type="button" className={styles.saveBtn} onClick={applyCrop} disabled={cropping}>
          {cropping ? 'Aplicando...' : 'Aplicar recorte'}
        </button>
      </div>
    </div>
  </div>
)}
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
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={styles.card}
    >
      <div className={styles.cardMedia}>
        {c.photo_url ? (
          <img
            src={c.photo_url}
            alt={c.name}
            className={styles.cardImage}
          />
        ) : (
          <div className={styles.cardImageEmpty}>
            {c.name?.[0]?.toUpperCase()}
          </div>
        )}

        <div className={styles.cardGradient} />

        <div className={styles.cardActions}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => onEdit(c)}
            title="Editar"
          >
            <Edit size={13} />
          </button>

          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionDanger}`}
            onClick={() => onDelete(c)}
            title="Eliminar"
          >
            <Trash2 size={13} />
          </button>
        </div>

        <div className={styles.cardOverlayContent}>
          <div className={styles.cardName}>
            {c.name}
          </div>

          <div className={styles.cardSection}>
            {c.section_name ||
              (c.type === 'fixed'
                ? 'Colaborador fijo'
                : 'Colaborador ocasional')}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
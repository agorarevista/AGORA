import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import { motion } from 'framer-motion';
import Cropper from 'react-easy-crop';

import {
  getAllSponsors,
  createSponsor,
  updateSponsor,
  deleteSponsor,
} from '../../api/sponsors.api';

import { uploadFile } from '../../api/admin.api';
import useAlert from '../../hooks/useAlert';
import useConfirm from '../../hooks/useConfirm';

import {
  Plus,
  Edit,
  Trash2,
  X,
  Upload,
  ExternalLink,
  Crop,
} from 'lucide-react';
const TYPE_OPTIONS = [
  { value: 'noticia',      label: 'Noticia' },
  { value: 'sponsor',      label: 'Sponsor' },
  { value: 'patrocinador', label: 'Patrocinador' },
];

const EMPTY = {
  type: 'noticia',
  title: '',
  body: '',
  image_url: '',
  image_x: 50,
  image_y: 50,
  image_zoom: 1,
  link_url: '',
  display_order: 0,
  is_active: true,
};

export default function SponsorsPage() {
  const alert   = useAlert();
  const confirm = useConfirm();

  const [items, setItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [editing, setEditing] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY);

  const [uploading, setUploading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [cropOpen, setCropOpen] =
    useState(false);

  const [cropSrc, setCropSrc] =
    useState('');

  const [crop, setCrop] =
    useState({
      x: 0,
      y: 0,
    });

  const [cropZoom, setCropZoom] =
    useState(1);

  const [cropPosition, setCropPosition] =
    useState({
      x: 50,
      y: 50,
    });

  const load = async () => {
    setLoading(true);
    try {
      setItems(await getAllSponsors());
    } catch {
      alert.error('Error', 'No se pudieron cargar los elementos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetCropper = () => {
    setCropOpen(false);
    setCropSrc('');

    setCrop({
      x: 0,
      y: 0,
    });

    setCropZoom(1);

    setCropPosition({
      x: 50,
      y: 50,
    });
  };

  const openNew = () => {
    setForm({
      ...EMPTY,
    });

    setEditing('new');
    resetCropper();
  };

  const openEdit = item => {
    setForm({
      type:
        item.type ||
        'noticia',

      title:
        item.title ||
        '',

      body:
        item.body ||
        '',

      image_url:
        item.image_url ||
        '',

      image_x:
        Number.isFinite(
          Number(item.image_x)
        )
          ? Number(item.image_x)
          : 50,

      image_y:
        Number.isFinite(
          Number(item.image_y)
        )
          ? Number(item.image_y)
          : 50,

      image_zoom:
        Number.isFinite(
          Number(item.image_zoom)
        )
          ? Number(item.image_zoom)
          : 1,

      link_url:
        item.link_url ||
        '',

      display_order:
        item.display_order ||
        0,

      is_active:
        item.is_active ??
        true,
    });

    setEditing(item.id);
    resetCropper();
  };

  const closeForm = () => {
    setEditing(null);

    setForm({
      ...EMPTY,
    });

    resetCropper();
  };

  const handleUpload = async event => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setUploading(true);

    try {
      const response =
        await uploadFile(
          file,
          'sponsors'
        );

      if (!response?.url) {
        throw new Error(
          'La API no devolvió la URL de la imagen'
        );
      }

      setForm(current => ({
        ...current,

        image_url:
          response.url,

        image_x:
          50,

        image_y:
          50,

        image_zoom:
          1,
      }));

      setCropSrc(
        response.url
      );

      setCrop({
        x: 0,
        y: 0,
      });

      setCropZoom(1);

      setCropPosition({
        x: 50,
        y: 50,
      });

      setCropOpen(true);

      alert.success(
        'Imagen subida',
        'Ahora puedes ajustar el encuadre.'
      );
    } catch (error) {
      console.error(
        'ERROR subiendo sponsor:',
        error?.response?.data ||
        error
      );

      alert.error(
        'Error',
        'No se pudo subir la imagen.'
      );
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const onCropComplete = useCallback(
    croppedArea => {
      const centerX =
        croppedArea.x +
        croppedArea.width / 2;

      const centerY =
        croppedArea.y +
        croppedArea.height / 2;

      setCropPosition({
        x:
          Math.min(
            100,
            Math.max(
              0,
              centerX
            )
          ),

        y:
          Math.min(
            100,
            Math.max(
              0,
              centerY
            )
          ),
      });
    },
    []
  );

  const openCropper = () => {
    if (!form.image_url) {
      return;
    }

    setCropSrc(
      form.image_url
    );

    setCrop({
      x: 0,
      y: 0,
    });

    setCropZoom(
      Number(form.image_zoom) ||
      1
    );

    setCropPosition({
      x:
        Number(form.image_x) ||
        50,

      y:
        Number(form.image_y) ||
        50,
    });

    setCropOpen(true);
  };

  const applyCrop = () => {
    if (!cropSrc) {
      return;
    }

    setForm(current => ({
      ...current,

      image_x:
        cropPosition.x,

      image_y:
        cropPosition.y,

      image_zoom:
        cropZoom,
    }));

    setCropOpen(false);

    alert.success(
      'Encuadre actualizado',
      'La posición y el zoom del banner fueron guardados.'
    );
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert.warning('Falta el título', 'El elemento necesita un título');
      return;
    }
    setSaving(true);
    try {
      if (editing === 'new') {
        await createSponsor(form);
        alert.success('Creado', 'Elemento agregado');
      } else {
        await updateSponsor(editing, form);
        alert.success('Guardado', 'Elemento actualizado');
      }
      closeForm();
      load();
    } catch {
      alert.error('Error', 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      type: 'danger',
      title: '¿Eliminar este elemento?',
      message: 'Esta acción es permanente.',
      confirmLabel: 'Sí, eliminar',
    });
    if (!ok) return;
    try {
      await deleteSponsor(id);
      setItems(prev => prev.filter(i => i.id !== id));
      alert.success('Eliminado', 'Elemento eliminado');
    } catch {
      alert.error('Error', 'No se pudo eliminar');
    }
  };

  const input = {
    width: '100%', padding: '8px 10px', border: '1px solid var(--color-gray-200)',
    borderRadius: 6, fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none',
    background: 'white', color: 'var(--color-primary)', marginBottom: 10,
  };
  const label = {
    display: 'block', fontFamily: 'var(--font-sans)', fontSize: 11,
    fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
    color: 'var(--color-gray-400)', marginBottom: 6, marginTop: 4,
  };

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: 4 }}>
            Home
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--color-primary)' }}>
            Sponsors y Noticias
          </h1>
        </div>
        <button
          onClick={openNew}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: 6, fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer' }}
        >
          <Plus size={16} /> Nuevo
        </button>
      </div>

      {/* Formulario */}
      {editing && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: 'white', border: '1px solid var(--color-gray-200)', borderRadius: 10, padding: 20, marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>
              {editing === 'new' ? 'Nuevo elemento' : 'Editar elemento'}
            </strong>
            <button onClick={closeForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-400)' }}>
              <X size={18} />
            </button>
          </div>

          <label style={label}>Tipo</label>
          <select
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            style={{ ...input, cursor: 'pointer' }}
          >
            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <label style={label}>Título</label>
          <input style={input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título" />

          <label style={label}>Texto (opcional)</label>
          <textarea style={{ ...input, minHeight: 70, resize: 'vertical' }} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Descripción o texto..." />

          <label style={label}>
            Banner / Imagen (opcional)
          </label>

          {form.image_url ? (
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '8 / 3',
                marginBottom: 10,
                overflow: 'hidden',
                borderRadius: 8,
                background: '#111',
                border:
                  '1px solid var(--color-gray-200)',
              }}
            >
              <img
                src={form.image_url}
                alt={
                  form.title ||
                  'Banner'
                }
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  objectFit: 'cover',

                  objectPosition:
                    `${form.image_x}% ${form.image_y}%`,

                  transform:
                    `scale(${form.image_zoom})`,

                  transformOrigin:
                    `${form.image_x}% ${form.image_y}%`,
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setForm(current => ({
                    ...current,
                    image_url: '',
                  }));

                  resetCropper();
                }}
                aria-label="Eliminar imagen"
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 30,
                  height: 30,
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  borderRadius: '50%',
                  color: 'white',
                  background:
                    'rgba(0,0,0,0.68)',
                  cursor: 'pointer',
                }}
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                aspectRatio: '8 / 3',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border:
                  '1px dashed var(--color-gray-300)',
                borderRadius: 8,
                color:
                  'var(--color-gray-400)',
                background:
                  'var(--color-gray-100)',
                fontFamily:
                  'var(--font-sans)',
                fontSize: 12,
              }}
            >
              Vista previa del banner
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 10,
            }}
          >
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                border:
                  '1px dashed var(--color-gray-300)',
                borderRadius: 6,
                background:
                  'var(--color-gray-100)',
                cursor: uploading
                  ? 'wait'
                  : 'pointer',
                fontFamily:
                  'var(--font-sans)',
                fontSize: 12,
                fontWeight: 600,
                color:
                  'var(--color-gray-500)',
              }}
            >
              <Upload size={14} />

              {uploading
                ? 'Subiendo...'
                : form.image_url
                  ? 'Cambiar imagen'
                  : 'Subir imagen'}

              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                hidden
              />
            </label>

            {form.image_url && (
              <button
                type="button"
                onClick={openCropper}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  border:
                    '1px solid var(--color-gray-300)',
                  borderRadius: 6,
                  background: 'white',
                  cursor: 'pointer',
                  fontFamily:
                    'var(--font-sans)',
                  fontSize: 12,
                  fontWeight: 600,
                  color:
                    'var(--color-gray-500)',
                }}
              >
                <Crop size={14} />

                Ajustar encuadre
              </button>
            )}
          </div>

          <div
            style={{
              fontSize: 11,
              lineHeight: 1.5,
              color:
                'var(--color-gray-400)',
              marginBottom: 10,
            }}
          >
            El recortador genera un banner horizontal de
            1600 × 600 px. Puedes mover la imagen y controlar
            el acercamiento. Si no subes imagen, se usará el
            diseño editorial de respaldo.
          </div>

          <label style={label}>Hipervínculo (opcional)</label>
          <input style={input} value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} placeholder="https://..." />

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={label}>Orden</label>
              <input type="number" style={input} value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: Number(e.target.value) }))} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 26, fontFamily: 'var(--font-sans)', fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              Activo (visible en el home)
            </label>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 16,
            }}
          >
            <button
              type="button"
              onClick={handleSave}
              disabled={
                saving ||
                uploading
              }
              style={{
                padding: '9px 20px',
                background:
                  'var(--color-accent)',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontFamily:
                  'var(--font-sans)',
                fontSize: 13,
                fontWeight: 700,
                cursor:
                  saving ||
                  uploading
                    ? 'not-allowed'
                    : 'pointer',

                opacity:
                  saving ||
                  uploading
                    ? 0.6
                    : 1,
              }}
            >
              {saving
                ? 'Guardando...'
                : 'Guardar'}
            </button>

            <button
              type="button"
              onClick={closeForm}
              style={{
                padding: '9px 20px',
                background: 'white',
                color:
                  'var(--color-primary)',
                border:
                  '1px solid var(--color-gray-300)',
                borderRadius: 6,
                fontFamily:
                  'var(--font-sans)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
          </div>

          {cropOpen && (
            <div
onClick={() => {
  setCropOpen(false);
}}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                background:
                  'rgba(0,0,0,0.84)',
              }}
            >
              <div
                onClick={event =>
                  event.stopPropagation()
                }
                style={{
                  width:
                    'min(94vw, 1000px)',
                  overflow: 'hidden',
                  borderRadius: 10,
                  background: '#181818',
                  boxShadow:
                    '0 30px 90px rgba(0,0,0,0.52)',
                }}
              >
                <div
                  style={{
                    height: 58,
                    padding: '0 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent:
                      'space-between',
                    borderBottom:
                      '1px solid rgba(255,255,255,0.09)',
                    background: '#202020',
                  }}
                >
                  <div>
                    <h4
                      style={{
                        margin: 0,
                        color: 'white',
                        fontFamily:
                          'var(--font-display)',
                        fontSize: 19,
                      }}
                    >
                      Ajustar banner
                    </h4>

                    <span
                      style={{
                        color:
                          'rgba(255,255,255,0.52)',
                        fontFamily:
                          'var(--font-sans)',
                        fontSize: 10,
                        letterSpacing: 1,
                        textTransform:
                          'uppercase',
                      }}
                    >
                      Formato horizontal 1600 × 600
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCropOpen(false);
                    }}
                    aria-label="Cerrar recortador"
                    style={{
                      padding: 6,
                      display: 'flex',
                      border: 'none',
                      color:
                        'rgba(255,255,255,0.74)',
                      background:
                        'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height:
                      'min(60vh, 570px)',
                    minHeight: 360,
                    background: '#101010',
                  }}
                >
                  <Cropper
                    image={cropSrc}
                    crop={crop}
                    zoom={cropZoom}
                    aspect={8 / 3}
                    onCropChange={setCrop}
                    onZoomChange={
                      setCropZoom
                    }
                    onCropComplete={
                      onCropComplete
                    }
                    showGrid
                    objectFit="contain"
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: 18,
                    background: '#202020',
                  }}
                >
                  <span
                    style={{
                      color:
                        'rgba(255,255,255,0.62)',
                      fontFamily:
                        'var(--font-sans)',
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform:
                        'uppercase',
                      letterSpacing: 1,
                    }}
                  >
                    Zoom
                  </span>

                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={cropZoom}
                    onChange={event =>
                      setCropZoom(
                        Number(
                          event.target.value
                        )
                      )
                    }
                    style={{
                      flex: 1,
                      accentColor:
                        'var(--color-accent)',
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setCropOpen(false)
                    }
                    style={{
                      padding: '9px 18px',
                      border:
                        '1px solid rgba(255,255,255,0.18)',
                      borderRadius: 6,
                      color: 'white',
                      background:
                        'transparent',
                      cursor: 'pointer',
                      fontFamily:
                        'var(--font-sans)',
                      fontSize: 12,
                    }}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={applyCrop}
                    style={{
                      minWidth: 145,
                      padding: '10px 18px',
                      border: 'none',
                      borderRadius: 6,
                      color: 'white',
                      background:
                        'var(--color-accent)',
                      cursor: 'pointer',
                      fontFamily:
                        'var(--font-sans)',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Aplicar encuadre
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Lista */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-400)' }}>Cargando...</div>
      ) : items.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-gray-400)', fontFamily: 'var(--font-body)' }}>
          No hay elementos. Crea el primero con “Nuevo”.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'white', border: '1px solid var(--color-gray-200)', borderRadius: 8, padding: 12, opacity: item.is_active ? 1 : 0.55 }}>
              <div style={{ width: 72, height: 46, borderRadius: 4, overflow: 'hidden', flexShrink: 0, background: 'var(--color-gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.image_url
                  ? <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--color-accent)', opacity: 0.5 }}>Λ</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', padding: '2px 7px', borderRadius: 3, color: 'white', background: item.type === 'sponsor' ? '#1B4F8A' : item.type === 'patrocinador' ? '#B8860B' : 'var(--color-accent)' }}>
                    {item.type}
                  </span>
                  {item.link_url && <ExternalLink size={12} style={{ color: 'var(--color-gray-400)' }} />}
                  <span style={{ fontSize: 11, color: 'var(--color-gray-400)' }}>orden {item.display_order}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--color-primary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.title}
                </div>
              </div>
              <button onClick={() => openEdit(item)} style={{ width: 32, height: 32, border: '1px solid var(--color-gray-200)', borderRadius: 6, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gray-500)' }}>
                <Edit size={14} />
              </button>
              <button onClick={() => handleDelete(item.id)} style={{ width: 32, height: 32, border: '1px solid var(--color-gray-200)', borderRadius: 6, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CC3333' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
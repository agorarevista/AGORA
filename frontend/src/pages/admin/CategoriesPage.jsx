import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import { motion } from 'framer-motion';
import Cropper from 'react-easy-crop';

import {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../api/categories.api.js';

import {
  getCollaborators,
} from '../../api/collaborators.api';

import {
  uploadFile,
} from '../../api/admin.api';

import useAlert from '../../hooks/useAlert';
import useConfirm from '../../hooks/useConfirm';

import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  X,
  Check,
  ChevronDown,
  Folder,
  FolderOpen,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';

import styles from './CategoriesPage.module.css';

const EMPTY_FORM = {
  name: '',
  description: '',
  cover_image_url: '',
  color: '#8B1A4A',
  display_order: 0,
  has_dropdown: true,
  is_active: true,
  parent_id: null,
  nav_type: 'parent',
  content_type: 'system',
  show_in_navbar: true,
  fixed_collaborator_id: null,
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

async function getCroppedBannerFile(
  imageSrc,
  pixelCrop
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = 1600;
  canvas.height = 700;

  context.drawImage(
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
    canvas.toBlob(
      blob => {
        if (!blob) {
          reject(
            new Error(
              'No se pudo generar el banner'
            )
          );

          return;
        }

        resolve(
          new File(
            [blob],
            `columna-${Date.now()}.jpg`,
            {
              type: 'image/jpeg',
            }
          )
        );
      },
      'image/jpeg',
      0.92
    );
  });
}

export default function CategoriesPage() {
  const alert   = useAlert();
  const confirm = useConfirm();
  const [categories, setCategories] = useState([]);
  const [collaborators, setCollaborators] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [
    expandedFolders,
    setExpandedFolders,
  ] = useState({});

  const [uploadingBanner, setUploadingBanner] =
    useState(false);

  const [cropOpen, setCropOpen] =
    useState(false);

  const [cropSource, setCropSource] =
    useState('');

  const [crop, setCrop] =
    useState({
      x: 0,
      y: 0,
    });

  const [cropZoom, setCropZoom] =
    useState(1);

  const [
    croppedAreaPixels,
    setCroppedAreaPixels,
  ] = useState(null);

  const [croppingBanner, setCroppingBanner] =
    useState(false);

const load = async () => {
  setLoading(true);

  try {
    const [
      categoryData,
      collaboratorData,
    ] = await Promise.all([
      getAdminCategories(),
      getCollaborators(),
    ]);

    const categoryList =
      Array.isArray(categoryData)
        ? categoryData
        : [];

    const collaboratorList =
      Array.isArray(collaboratorData)
        ? collaboratorData
        : [];

    setCategories(categoryList);

    setCollaborators(
      collaboratorList.filter(
        collaborator =>
          collaborator.type === 'fixed' &&
          collaborator.is_active !== false
      )
    );

    setExpandedFolders(previous => {
      const nextState = {
        ...previous,
      };

      categoryList.forEach(category => {
        if (
          typeof nextState[category.id] !==
          'boolean'
        ) {
          nextState[category.id] = false;
        }
      });

      return nextState;
    });
  } catch (error) {
    console.error(
      'ERROR cargando categorías:',
      error
    );

    alert.error(
      'Error',
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      'No se pudieron cargar las categorías'
    );
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { load(); }, []);
const toggleFolder = parentId => {
  setExpandedFolders(previous => ({
    ...previous,
    [parentId]: !previous[parentId],
  }));
};
const openNew = (parentId = null) => {
  const isChild = Boolean(parentId);
  const isColumn =
    isColumnsParentId(parentId);

  setEditing(null);

  setForm({
    ...EMPTY_FORM,

    parent_id: parentId,

    nav_type:
      isChild
        ? 'child'
        : 'parent',

    content_type:
      isColumn
        ? 'fixed_column'
        : isChild
          ? 'general'
          : 'system',

    show_in_navbar: true,
    fixed_collaborator_id: null,
    cover_image_url: '',
    has_dropdown: !isChild,
  });

  if (parentId) {
    setExpandedFolders(previous => ({
      ...previous,
      [parentId]: true,
    }));
  }

  setShowForm(true);
};

const openEdit = category => {
  setEditing(category.id);

  setForm({
    name: category.name || '',
    description: category.description || '',
    cover_image_url:
      category.cover_image_url || '',
    color: category.color || '#8B1A4A',
    display_order: category.display_order || 0,
    has_dropdown: category.has_dropdown ?? false,
    is_active: category.is_active ?? true,
    parent_id: category.parent_id || null,
    nav_type:
      category.nav_type ||
      (category.parent_id ? 'child' : 'parent'),
    content_type:
      category.content_type ||
      (category.parent_id ? 'general' : 'system'),
    show_in_navbar: category.show_in_navbar ?? true,
    fixed_collaborator_id:
      category.fixed_collaborator_id || null,
  });

  setShowForm(true);
};
const handleBannerUpload = async event => {
  const file = event.target.files?.[0];

  event.target.value = '';

  if (!file) {
    return;
  }

  if (!file.type.startsWith('image/')) {
    alert.warning(
      'Archivo no válido',
      'Selecciona una imagen para el banner'
    );

    return;
  }

  setUploadingBanner(true);

  try {
    const response = await uploadFile(
      file,
      'categories'
    );

    setForm(current => ({
      ...current,
      cover_image_url: response.url,
    }));

    setCropSource(response.url);
    setCrop({
      x: 0,
      y: 0,
    });
    setCropZoom(1);
    setCroppedAreaPixels(null);
    setCropOpen(true);
  } catch (error) {
    console.error(
      'ERROR subiendo banner:',
      error
    );

    alert.error(
      'Error',
      'No se pudo subir el banner'
    );
  } finally {
    setUploadingBanner(false);
  }
};

const openBannerCropper = () => {
  if (!form.cover_image_url) {
    return;
  }

  setCropSource(form.cover_image_url);
  setCrop({
    x: 0,
    y: 0,
  });
  setCropZoom(1);
  setCroppedAreaPixels(null);
  setCropOpen(true);
};

const onBannerCropComplete = useCallback(
  (_, pixels) => {
    setCroppedAreaPixels(pixels);
  },
  []
);

const applyBannerCrop = async () => {
  if (
    !cropSource ||
    !croppedAreaPixels
  ) {
    return;
  }

  setCroppingBanner(true);

  try {
    const croppedFile =
      await getCroppedBannerFile(
        cropSource,
        croppedAreaPixels
      );

    const response = await uploadFile(
      croppedFile,
      'categories'
    );

    setForm(current => ({
      ...current,
      cover_image_url: response.url,
    }));

    setCropOpen(false);

    alert.success(
      'Banner ajustado',
      'El encuadre panorámico fue aplicado'
    );
  } catch (error) {
    console.error(
      'ERROR recortando banner:',
      error
    );

    alert.error(
      'Error',
      'No se pudo aplicar el recorte'
    );
  } finally {
    setCroppingBanner(false);
  }
};
  const handleSave = async () => {
    if (!form.name.trim()) {
      alert.warning(
        'Falta el nombre',
        'La sección necesita un nombre'
      );

      return;
    }

    if (
      isFixedColumnForm &&
      !form.fixed_collaborator_id
    ) {
      alert.warning(
        'Falta el autor',
        'Selecciona el colaborador fijo de esta columna'
      );

      return;
    }

    if (
      isFixedColumnForm &&
      !form.cover_image_url
    ) {
      alert.warning(
        'Falta el banner',
        'Agrega una imagen panorámica para esta columna'
      );

      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,

        content_type:
          isFixedColumnForm
            ? 'fixed_column'
            : form.nav_type === 'parent'
              ? 'system'
              : 'general',

        fixed_collaborator_id:
          isFixedColumnForm
            ? form.fixed_collaborator_id
            : null,

        cover_image_url:
          isFixedColumnForm
            ? form.cover_image_url
            : null,
      };

      if (editing) {
        await updateCategory(editing, payload);
        alert.success('Actualizado', 'Sección actualizada correctamente');
      } else {
        await createCategory(payload);
        alert.success('Creado', 'Sección creada correctamente');
      }
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      alert.error('Error', err.response?.data?.error || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (cat) => {
    try {
      await updateCategory(cat.id, { is_active: !cat.is_active });
      alert.success(cat.is_active ? 'Ocultada' : 'Visible', `"${cat.name}" actualizada`);
      load();
    } catch { alert.error('Error', 'No se pudo actualizar'); }
  };

const handleDelete = async (cat) => {
  const ok = await confirm({
    type: 'error',
    title: `¿Eliminar "${cat.name}"?`,
    message: 'Esta acción no se puede deshacer.',
    confirmLabel: 'Sí, eliminar',
  });
  if (!ok) return;
    try {
      await deleteCategory(cat.id);
      alert.success('Eliminada', `"${cat.name}" fue eliminada`);
      load();
    } catch { alert.error('Error', 'No se pudo eliminar'); }
  };

const parents = categories.filter(
  category =>
    category.nav_type === 'parent' ||
    !category.parent_id
);

const columnsParent = parents.find(
  category =>
    category.slug === 'columnas' ||
    category.name
      ?.trim()
      .toLowerCase() === 'columnas'
);

const isColumnsParentId = parentId =>
  Boolean(
    parentId &&
    columnsParent?.id === parentId
  );

const isFixedColumnForm =
  form.nav_type === 'child' &&
  isColumnsParentId(form.parent_id);

const getChildren = parent =>
  Array.isArray(parent?.subcategories)
    ? parent.subcategories
    : [];

  return (
    <div className={styles.page}>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.header}
      >
        <div>
          <div className={styles.headerLabel}>Contenido</div>
          <h1 className={styles.headerTitle}>Secciones</h1>
          <p className={styles.headerSub}>
            Gestiona las categorías y subsecciones del navbar
          </p>
        </div>
        <button onClick={() => openNew()} className={styles.newBtn}>
          <Plus size={16} /> Nueva sección
        </button>
      </motion.div>

      {/* Modal de formulario */}
      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <motion.div
            className={styles.modal}
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.modalHeader}>
              <h3>{editing ? 'Editar sección' : 'Nueva sección'}</h3>
              <button onClick={() => setShowForm(false)} className={styles.modalClose}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className={styles.input}
                  placeholder="ej: Poesía"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Sección padre</label>
                <select
                  value={form.parent_id || ''}
                  onChange={event => {
                    const selectedParentId =
                      event.target.value || null;

                    const selectedIsColumn =
                      isColumnsParentId(
                        selectedParentId
                      );

                    setForm(current => ({
                      ...current,

                      parent_id:
                        selectedParentId,

                      nav_type:
                        selectedParentId
                          ? 'child'
                          : 'parent',

                      content_type:
                        selectedIsColumn
                          ? 'fixed_column'
                          : selectedParentId
                            ? 'general'
                            : 'system',

                      fixed_collaborator_id:
                        selectedIsColumn
                          ? current.fixed_collaborator_id
                          : null,

                      cover_image_url:
                        selectedIsColumn
                          ? current.cover_image_url
                          : '',

                      has_dropdown:
                        !selectedParentId,
                    }));
                  }}
                  className={styles.select}
                >
                  <option value="">
                    — Sección principal —
                  </option>

                  {parents
                    .filter(
                      parent =>
                        !editing ||
                        parent.id !== editing
                    )
                    .map(parent => (
                      <option
                        key={parent.id}
                        value={parent.id}
                      >
                        {parent.name}
                      </option>
                    ))}
                </select>
              </div>

              <div
                className={styles.formGroup}
                style={{
                  gridColumn: '1 / -1',
                }}
              >
                <label className={styles.label}>
                  Descripción
                </label>

                <textarea
                  value={form.description}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      description:
                        event.target.value,
                    }))
                  }
                  className={styles.textarea}
                  rows={3}
                  placeholder={
                    isFixedColumnForm
                      ? 'Descripción editorial que aparecerá sobre el banner...'
                      : 'Descripción breve (opcional)'
                  }
                />
              </div>

              {isFixedColumnForm && (
                <div
                  className={styles.columnEditor}
                  style={{
                    gridColumn: '1 / -1',
                  }}
                >
                  <div className={styles.columnEditorHeader}>
                    <div>
                      <span
                        className={
                          styles.columnEditorEyebrow
                        }
                      >
                        Columna fija
                      </span>

                      <h4
                        className={
                          styles.columnEditorTitle
                        }
                      >
                        Autor y banner editorial
                      </h4>
                    </div>

                    <span
                      className={
                        styles.columnEditorBadge
                      }
                    >
                      Vista pública
                    </span>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Colaborador fijo *
                    </label>

                    <select
                      value={
                        form.fixed_collaborator_id ||
                        ''
                      }
                      onChange={event =>
                        setForm(current => ({
                          ...current,
                          fixed_collaborator_id:
                            event.target.value ||
                            null,
                        }))
                      }
                      className={styles.select}
                    >
                      <option value="">
                        — Selecciona un autor —
                      </option>

                      {collaborators.map(
                        collaborator => {
                          const categoryUsingAuthor =
                            categories
                              .flatMap(parent => [
                                parent,
                                ...(
                                  parent.subcategories ||
                                  []
                                ),
                              ])
                              .find(
                                category =>
                                  category
                                    .fixed_collaborator_id ===
                                    collaborator.id &&
                                  category.id !== editing
                              );

                          return (
                            <option
                              key={collaborator.id}
                              value={collaborator.id}
                              disabled={
                                Boolean(
                                  categoryUsingAuthor
                                )
                              }
                            >
                              {collaborator.name}
                              {categoryUsingAuthor
                                ? ` — ${categoryUsingAuthor.name}`
                                : ''}
                            </option>
                          );
                        }
                      )}
                    </select>

                    <span className={styles.fieldHelp}>
                      Solo aparecen colaboradores
                      activos de tipo fijo. Cada autor
                      puede pertenecer a una sola
                      columna.
                    </span>
                  </div>

                  <div className={styles.bannerEditor}>
                    <div className={styles.bannerPreview}>
                      {form.cover_image_url ? (
                        <>
                          <img
                            src={
                              form.cover_image_url
                            }
                            alt=""
                          />

                          <div
                            className={
                              styles.bannerPreviewOverlay
                            }
                          >
                            <span>
                              {form.name ||
                                'Nombre de la columna'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div
                          className={
                            styles.bannerEmpty
                          }
                        >
                          <ImageIcon size={34} />

                          <span>
                            Banner panorámico
                          </span>

                          <small>
                            Proporción 16:7
                          </small>
                        </div>
                      )}
                    </div>

                    <div className={styles.bannerActions}>
                      <label
                        className={
                          styles.bannerButton
                        }
                      >
                        <Upload size={14} />

                        {uploadingBanner
                          ? 'Subiendo...'
                          : 'Subir banner'}

                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          disabled={
                            uploadingBanner
                          }
                          onChange={
                            handleBannerUpload
                          }
                        />
                      </label>

                      {form.cover_image_url && (
                        <>
                          <button
                            type="button"
                            className={
                              styles.bannerButton
                            }
                            onClick={
                              openBannerCropper
                            }
                          >
                            Ajustar encuadre
                          </button>

                          <button
                            type="button"
                            className={
                              styles.bannerRemoveButton
                            }
                            onClick={() =>
                              setForm(current => ({
                                ...current,
                                cover_image_url: '',
                              }))
                            }
                          >
                            Quitar
                          </button>
                        </>
                      )}
                    </div>

                    <input
                      type="text"
                      value={
                        form.cover_image_url || ''
                      }
                      onChange={event =>
                        setForm(current => ({
                          ...current,
                          cover_image_url:
                            event.target.value,
                        }))
                      }
                      className={styles.input}
                      placeholder="O pega una URL de imagen..."
                    />
                  </div>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label}>Color</label>
                <div className={styles.colorRow}>
                  <input
                    type="color"
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className={styles.colorInput}
                  />
                  <input
                    type="text"
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className={styles.input}
                    placeholder="#8B1A4A"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Orden en navbar</label>
                <input
                  type="number"
                  value={form.display_order}
                  onChange={e => setForm(f => ({ ...f, display_order: parseInt(e.target.value) || 0 }))}
                  className={styles.input}
                  min={0}
                />
              </div>

              {form.nav_type === 'parent' && (
                <div className={styles.formGroup}>
                  <label className={styles.checkLabel}>
                    <input
                      type="checkbox"
                      checked={form.has_dropdown}
                      onChange={event =>
                        setForm(current => ({
                          ...current,
                          has_dropdown:
                            event.target.checked,
                        }))
                      }
                    />

                    Tiene submenú en navbar
                  </label>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  />
                  Visible en el sitio
                </label>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowForm(false)}
                className={styles.cancelBtn}
              >
                Cancelar
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className={styles.saveBtn}
              >
                <Check size={14} />

                {saving
                  ? 'Guardando...'
                  : editing
                    ? 'Actualizar'
                    : 'Crear sección'}
              </button>
            </div>

            {cropOpen && (
              <div
                className={styles.cropModalOverlay}
                onClick={() => setCropOpen(false)}
              >
                <div
                  className={styles.cropModal}
                  onClick={event =>
                    event.stopPropagation()
                  }
                >
                  <div className={styles.cropHeader}>
                    <div>
                      <span>
                        Editor panorámico
                      </span>

                      <h4>
                        Ajustar banner de columna
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setCropOpen(false)
                      }
                    >
                      <X size={19} />
                    </button>
                  </div>

                  <div className={styles.cropArea}>
                    <Cropper
                      image={cropSource}
                      crop={crop}
                      zoom={cropZoom}
                      aspect={16 / 7}
                      onCropChange={setCrop}
                      onZoomChange={setCropZoom}
                      onCropComplete={
                        onBannerCropComplete
                      }
                      showGrid
                    />
                  </div>

                  <div className={styles.cropFooter}>
                    <div
                      className={
                        styles.cropZoomControl
                      }
                    >
                      <span>Zoom</span>

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
                      />
                    </div>

                    <button
                      type="button"
                      className={styles.cancelBtn}
                      onClick={() =>
                        setCropOpen(false)
                      }
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      className={styles.saveBtn}
                      onClick={applyBannerCrop}
                      disabled={croppingBanner}
                    >
                      {croppingBanner
                        ? 'Aplicando...'
                        : 'Aplicar recorte'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

{/* Lista */}
{loading ? (
  <div className={styles.skeleton}>
    {[1, 2, 3, 4].map(item => (
      <div
        key={item}
        className={styles.skeletonRow}
      />
    ))}
  </div>
) : (
  <div className={styles.list}>
    {parents.map((parent, index) => {
      const children = getChildren(parent);
      const isExpanded = Boolean(expandedFolders[parent.id]);
      const activeChildren = children.filter(child => child.is_active).length;
      const inactiveChildren = children.length - activeChildren;

      return (
        <motion.div
          key={parent.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
          className={`
            ${styles.catGroup}
            ${isExpanded ? styles.catGroupOpen : ''}
          `}
        >
          {/* ── CARPETA PADRE ─────────────────────────── */}
          <div
            className={`
              ${styles.catRow}
              ${styles.parentRow}
              ${isExpanded ? styles.parentRowOpen : ''}
              ${!parent.is_active ? styles.catInactive : ''}
            `}
          >
            <button
              type="button"
              className={styles.folderMain}
              onClick={() => toggleFolder(parent.id)}
              aria-expanded={isExpanded}
            >
              <GripVertical
                size={16}
                className={styles.grip}
              />

              <span
                className={`
                  ${styles.folderChevron}
                  ${isExpanded ? styles.folderChevronOpen : ''}
                `}
              >
                <ChevronDown size={17} />
              </span>

              <span className={styles.folderIcon}>
                {isExpanded ? (
                  <FolderOpen size={20} />
                ) : (
                  <Folder size={20} />
                )}
              </span>

              <span
                className={styles.catColor}
                style={{
                  background:
                    parent.color ||
                    'var(--color-accent)',
                }}
              />

              <span className={styles.folderContent}>
                <span className={styles.folderTitleRow}>
                  <span className={styles.catName}>
                    {parent.name}
                  </span>

                  <span className={styles.childrenCounter}>
                    {children.length}
                  </span>
                </span>

                {parent.description && (
                  <span className={styles.catDesc}>
                    {parent.description}
                  </span>
                )}
              </span>

              <span className={styles.catMeta}>
                <span className={styles.metaBadge}>
                  {activeChildren} publicadas
                </span>

                {inactiveChildren > 0 && (
                  <span className={styles.metaBadgeOff}>
                    {inactiveChildren} ocultas
                  </span>
                )}

                {!parent.is_active && (
                  <span className={styles.metaBadgeOff}>
                    Carpeta oculta
                  </span>
                )}
              </span>
            </button>

            <div className={styles.catActions}>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => openNew(parent.id)}
                title="Agregar sección hija"
              >
                <Plus size={14} />
              </button>

              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => handleToggle(parent)}
                title={
                  parent.is_active
                    ? 'Despublicar carpeta'
                    : 'Publicar carpeta'
                }
              >
                {parent.is_active ? (
                  <EyeOff size={14} />
                ) : (
                  <Eye size={14} />
                )}
              </button>

              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => openEdit(parent)}
                title="Editar carpeta"
              >
                <Edit size={14} />
              </button>

              <button
                type="button"
                className={`
                  ${styles.actionBtn}
                  ${styles.actionDanger}
                `}
                onClick={() => handleDelete(parent)}
                title="Eliminar carpeta"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* ── CONTENIDO DE LA CARPETA ───────────────── */}
          <motion.div
            initial={false}
            animate={{
              height: isExpanded ? 'auto' : 0,
              opacity: isExpanded ? 1 : 0,
            }}
            transition={{
              height: { duration: 0.26 },
              opacity: { duration: 0.18 },
            }}
            className={styles.childrenWrapper}
          >
            <div className={styles.childrenInner}>
              <div className={styles.childrenHeader}>
                <div>
                  <span className={styles.childrenEyebrow}>
                    Contenido de la carpeta
                  </span>

                  <h3 className={styles.childrenTitle}>
                    {parent.name}
                  </h3>
                </div>

                <button
                  type="button"
                  className={styles.addChildBtn}
                  onClick={() => openNew(parent.id)}
                >
                  <Plus size={14} />
                  Nueva sección hija
                </button>
              </div>

              {children.length > 0 ? (
                <div className={styles.childrenList}>
                  {children.map((child, childIndex) => (
                    <motion.div
                      key={child.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: childIndex * 0.035,
                      }}
                      className={`
                        ${styles.catRow}
                        ${styles.catChild}
                        ${!child.is_active
                          ? styles.catInactive
                          : ''}
                      `}
                    >
                      <div className={styles.catLeft}>
                        <div className={styles.childConnector}>
                          <span />
                        </div>

                        <div
                          className={styles.catColor}
                          style={{
                            background:
                              child.color ||
                              'var(--color-gray-300)',
                          }}
                        />

                        <div className={styles.childContent}>
                          <div className={styles.childTitleRow}>
                            <span className={styles.catName}>
                              {child.name}
                            </span>

                            <span className={styles.childTypeBadge}>
                              {child.content_type === 'fixed_column'
                                ? 'Columna fija'
                                : child.content_type === 'system'
                                  ? 'Sistema'
                                  : 'Sección general'}
                            </span>

                            {!child.is_active && (
                              <span className={styles.metaBadgeOff}>
                                Despublicada
                              </span>
                            )}
                          </div>

                          {child.description && (
                            <div className={styles.catDesc}>
                              {child.description}
                            </div>
                          )}

                          {child.fixed_collaborator?.name && (
                            <div className={styles.childAuthor}>
                              Autor fijo:{' '}
                              {child.fixed_collaborator.name}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={styles.catActions}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => handleToggle(child)}
                          title={
                            child.is_active
                              ? 'Despublicar sección'
                              : 'Publicar sección'
                          }
                        >
                          {child.is_active ? (
                            <EyeOff size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                        </button>

                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => openEdit(child)}
                          title="Editar sección"
                        >
                          <Edit size={14} />
                        </button>

                        <button
                          type="button"
                          className={`
                            ${styles.actionBtn}
                            ${styles.actionDanger}
                          `}
                          onClick={() => handleDelete(child)}
                          title="Eliminar sección"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className={styles.folderEmpty}>
                  <Folder size={24} />

                  <div>
                    <strong>Carpeta vacía</strong>
                    <p>
                      Agrega la primera sección hija dentro de
                      esta carpeta.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openNew(parent.id)}
                  >
                    <Plus size={14} />
                    Agregar sección
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      );
    })}

    {parents.length === 0 && (
      <div className={styles.empty}>
        <span>◉</span>
        <p>
          No hay secciones todavía. Crea la primera.
        </p>
      </div>
    )}
  </div>
)}
    </div>
  );
}
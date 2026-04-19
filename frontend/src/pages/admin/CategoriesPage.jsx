import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/categories.api';
import useAlert from '../../hooks/useAlert';
import { Plus, Edit, Trash2, GripVertical, Eye, EyeOff, X, Check } from 'lucide-react';
import styles from './CategoriesPage.module.css';

const EMPTY_FORM = {
  name: '', description: '', color: '#8B1A4A',
  display_order: 0, has_dropdown: true, is_active: true, parent_id: null
};

export default function CategoriesPage() {
  const alert = useAlert();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch { alert.error('Error', 'No se pudieron cargar las categorías'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = (parentId = null) => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, parent_id: parentId });
    setShowForm(true);
  };

  const openEdit = (cat) => {
    setEditing(cat.id);
    setForm({
      name: cat.name,
      description: cat.description || '',
      color: cat.color || '#8B1A4A',
      display_order: cat.display_order || 0,
      has_dropdown: cat.has_dropdown ?? true,
      is_active: cat.is_active ?? true,
      parent_id: cat.parent_id || null,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert.warning('Falta el nombre', 'La sección necesita un nombre');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateCategory(editing, form);
        alert.success('Actualizado', 'Sección actualizada correctamente');
      } else {
        await createCategory(form);
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
    if (!window.confirm(`¿Eliminar "${cat.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteCategory(cat.id);
      alert.success('Eliminada', `"${cat.name}" fue eliminada`);
      load();
    } catch { alert.error('Error', 'No se pudo eliminar'); }
  };

  // Separar padres e hijos
  const parents = categories.filter(c => !c.parent_id);
  const getChildren = (parentId) => categories.filter(c => c.parent_id === parentId);

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
                  onChange={e => setForm(f => ({ ...f, parent_id: e.target.value || null }))}
                  className={styles.select}
                >
                  <option value="">— Sección principal —</option>
                  {parents.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.label}>Descripción</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className={styles.textarea}
                  rows={2}
                  placeholder="Descripción breve (opcional)"
                />
              </div>

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

              <div className={styles.formGroup}>
                <label className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={form.has_dropdown}
                    onChange={e => setForm(f => ({ ...f, has_dropdown: e.target.checked }))}
                  />
                  Tiene submenú en navbar
                </label>
              </div>

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
              <button onClick={() => setShowForm(false)} className={styles.cancelBtn}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} className={styles.saveBtn}>
                <Check size={14} />
                {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear sección'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className={styles.skeleton}>
          {[1,2,3,4].map(i => <div key={i} className={styles.skeletonRow} />)}
        </div>
      ) : (
        <div className={styles.list}>
          {parents.map((cat, i) => {
            const children = getChildren(cat.id);
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={styles.catGroup}
              >
                {/* Categoría padre */}
                <div className={`${styles.catRow} ${!cat.is_active ? styles.catInactive : ''}`}>
                  <div className={styles.catLeft}>
                    <GripVertical size={16} className={styles.grip} />
                    <div
                      className={styles.catColor}
                      style={{ background: cat.color || 'var(--color-accent)' }}
                    />
                    <div>
                      <div className={styles.catName}>{cat.name}</div>
                      {cat.description && (
                        <div className={styles.catDesc}>{cat.description}</div>
                      )}
                    </div>
                    <div className={styles.catMeta}>
                      {cat.has_dropdown && (
                        <span className={styles.metaBadge}>Con submenú</span>
                      )}
                      {children.length > 0 && (
                        <span className={styles.metaBadge}>{children.length} subsección{children.length !== 1 ? 'es' : ''}</span>
                      )}
                      {!cat.is_active && (
                        <span className={styles.metaBadgeOff}>Oculta</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.catActions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => openNew(cat.id)}
                      title="Agregar subsección"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleToggle(cat)}
                      title={cat.is_active ? 'Ocultar' : 'Mostrar'}
                    >
                      {cat.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => openEdit(cat)}
                      title="Editar"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.actionDanger}`}
                      onClick={() => handleDelete(cat)}
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Subsecciones */}
                {children.map(child => (
                  <div
                    key={child.id}
                    className={`${styles.catRow} ${styles.catChild} ${!child.is_active ? styles.catInactive : ''}`}
                  >
                    <div className={styles.catLeft}>
                      <div className={styles.childIndent} />
                      <div
                        className={styles.catColor}
                        style={{ background: child.color || 'var(--color-gray-300)' }}
                      />
                      <div className={styles.catName}>{child.name}</div>
                      {!child.is_active && (
                        <span className={styles.metaBadgeOff}>Oculta</span>
                      )}
                    </div>
                    <div className={styles.catActions}>
                      <button className={styles.actionBtn} onClick={() => handleToggle(child)} title={child.is_active ? 'Ocultar' : 'Mostrar'}>
                        {child.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button className={styles.actionBtn} onClick={() => openEdit(child)} title="Editar">
                        <Edit size={14} />
                      </button>
                      <button className={`${styles.actionBtn} ${styles.actionDanger}`} onClick={() => handleDelete(child)} title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            );
          })}

          {parents.length === 0 && (
            <div className={styles.empty}>
              <span>◉</span>
              <p>No hay secciones todavía. Crea la primera.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
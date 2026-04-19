import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getUsers, createUser, updateUser, toggleUser } from '../../api/admin.api';
import useAlert from '../../hooks/useAlert';
import useAuthStore from '../../store/authStore';
import { Plus, Edit, Trash2, X, Check, Shield, User, Key } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';
import styles from './UsersPage.module.css';

const EMPTY_FORM = {
  username: '', display_name: '', email: '', role: 'editor', password: ''
};

const ROLES = {
  superadmin: { label: 'Super Admin', color: '#8B1A4A', bg: 'rgba(139,26,74,0.1)' },
  admin:      { label: 'Admin',       color: '#1B4F8A', bg: 'rgba(27,79,138,0.1)' },
  editor:     { label: 'Editor',      color: '#2E6E3E', bg: 'rgba(46,110,62,0.1)' },
};

export default function UsersPage() {
  const alert              = useAlert();
  const { user: me }       = useAuthStore();
  const [users, setUsers]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [showPass, setShowPass] = useState(false);

const load = async () => {
  setLoading(true);
  try { setUsers(await getUsers()); }
  catch { alert.error('Error', 'No se pudieron cargar los usuarios'); }
  setLoading(false);
};

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowPass(true);
    setShowForm(true);
  };

  const openEdit = (u) => {
    setEditing(u.id);
    setForm({
      username: u.username || '',
      display_name: u.display_name || '',
      email: u.email || '',
      role: u.role || 'editor',
      password: ''
    });
    setShowPass(false);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.username.trim()) {
      alert.warning('Falta usuario', 'El nombre de usuario es requerido');
      return;
    }
    if (!editing && !form.password.trim()) {
      alert.warning('Falta contraseña', 'Define una contraseña para el nuevo usuario');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
if (editing) {
  await updateUser(editing, payload);
  alert.success('Actualizado', 'Usuario actualizado correctamente');
} else {
  await createUser(payload);
  alert.success('Creado', 'Usuario creado correctamente');
}
      setShowForm(false);
      load();
    } catch (err) {
      alert.error('Error', err.response?.data?.error || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

const handleDelete = async (u) => {
  if (u.id === me?.id) {
    alert.warning('Acción no permitida', 'No puedes eliminarte a ti mismo');
    return;
  }
  if (!window.confirm(`¿Deshabilitar al usuario "${u.username}"?`)) return;
  try {
    await toggleUser(u.id);
    alert.success('Actualizado', `"${u.username}" fue deshabilitado`);
    load();
  } catch { alert.error('Error', 'No se pudo actualizar'); }
};

  return (
    <div className={styles.page}>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.header}
      >
        <div>
          <div className={styles.headerLabel}>Administración</div>
          <h1 className={styles.headerTitle}>Usuarios del panel</h1>
          <p className={styles.headerSub}>Gestiona quién tiene acceso al panel editorial</p>
        </div>
        <button onClick={openNew} className={styles.newBtn}>
          <Plus size={16} /> Nuevo usuario
        </button>
      </motion.div>

      {/* Modal */}
      {showForm && (
        <div className={styles.overlay} onClick={() => setShowForm(false)}>
          <motion.div
            className={styles.modal}
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.modalHeader}>
              <h3>{editing ? 'Editar usuario' : 'Nuevo usuario'}</h3>
              <button onClick={() => setShowForm(false)} className={styles.modalClose}><X size={18}/></button>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre de usuario *</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className={styles.input}
                  placeholder="ej: editor_maria"
                  autoComplete="off"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre completo</label>
                <input
                  type="text"
                  value={form.display_name}
                  onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                  className={styles.input}
                  placeholder="María García"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className={styles.input}
                  placeholder="maria@agorarevista.com"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Rol</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className={styles.select}
                >
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.label}>
                  {editing ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
                </label>
                <div className={styles.passRow}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className={styles.input}
                    placeholder={editing ? 'Dejar vacío para mantener' : 'Contraseña segura'}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.passToggle}
                    onClick={() => setShowPass(p => !p)}
                  >
                    <Key size={14} />
                    {showPass ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button onClick={() => setShowForm(false)} className={styles.cancelBtn}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} className={styles.saveBtn}>
                <Check size={14} />
                {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear usuario'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className={styles.skeleton}>
          {[1,2,3].map(i => <div key={i} className={styles.skeletonRow} />)}
        </div>
      ) : (
        <div className={styles.list}>
          {users.map((u, i) => {
            const role = ROLES[u.role] || ROLES.editor;
            const isMe = u.id === me?.id;
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`${styles.userRow} ${isMe ? styles.userRowMe : ''}`}
              >
                <div className={styles.userAvatar}>
                  {u.display_name?.[0] || u.username?.[0] || <User size={16} />}
                </div>
                <div className={styles.userInfo}>
                  <div className={styles.userName}>
                    {u.display_name || u.username}
                    {isMe && <span className={styles.youBadge}>Tú</span>}
                  </div>
                  <div className={styles.userMeta}>
                    @{u.username}
                    {u.email && <> · {u.email}</>}
                    {u.last_login && <> · Último acceso: {formatDate(u.last_login)}</>}
                  </div>
                </div>
                <span
                  className={styles.roleBadge}
                  style={{ background: role.bg, color: role.color }}
                >
                  <Shield size={10} />
                  {role.label}
                </span>
                <div className={styles.userActions}>
                  <button className={styles.actionBtn} onClick={() => openEdit(u)} title="Editar">
                    <Edit size={14} />
                  </button>
                  {!isMe && (
                    <button className={`${styles.actionBtn} ${styles.actionDanger}`} onClick={() => handleDelete(u)} title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
          {users.length === 0 && (
            <div className={styles.empty}>No hay usuarios registrados.</div>
          )}
        </div>
      )}
    </div>
  );
}
import { NavLink, Link } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import styles from './Sidebar.module.css';

const MENU = [
  {
    section: 'Principal',
    items: [
      { to: '/admin/dashboard',     icon: '⌂', label: 'Dashboard' },
      { to: '/admin/analytics',     icon: '◎', label: 'Analítica' },
    ]
  },
  {
    section: 'Contenido',
    items: [
      { to: '/admin/articulos',     icon: '✦', label: 'Artículos' },
      { to: '/admin/ediciones',     icon: '◈', label: 'Ediciones' },
      { to: '/admin/categorias',    icon: '◉', label: 'Categorías' },
      { to: '/admin/colaboradores', icon: '◍', label: 'Colaboradores' },
    ]
  },
  {
    section: 'Comunidad',
    items: [
      { to: '/admin/convocatorias', icon: '◆', label: 'Convocatorias' },
      { to: '/admin/comentarios',   icon: '◇', label: 'Comentarios' },
    ]
  },
  {
    section: 'Sistema',
    items: [
      { to: '/admin/usuarios',      icon: '◎', label: 'Usuarios' },
      { to: '/admin/configuracion', icon: '⚙', label: 'Configuración' },
    ]
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <Link to="/" className={styles.logo}>
        <span className={styles.logoSymbol}>Λ</span>
        <div className={styles.logoText}>
          <span className={styles.logoName}>AGORÁ</span>
          <span className={styles.logoSub}>Panel Editorial</span>
        </div>
      </Link>
      <div className={styles.meander} />

      {/* Navegación */}
      <nav className={styles.nav}>
        {MENU.map(group => (
          <div key={group.section} className={styles.section}>
            <div className={styles.sectionTitle}>{group.section}</div>
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${styles.link} ${isActive ? styles.active : ''}`
                }
              >
                <span className={styles.linkIcon}>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Usuario */}
      <div className={styles.bottom}>
        {user && (
          <div className={styles.user}>
            <div className={styles.avatar}>
              {user.full_name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <div className={styles.userName}>{user.full_name}</div>
              <div className={styles.userRole}>{user.role}</div>
            </div>
          </div>
        )}
        <button className={styles.logoutBtn} onClick={logout}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
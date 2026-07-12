import {
  NavLink,
  Link,
} from 'react-router-dom';

import {
  BarChart3,
  BookOpen,
  FileText,
  FolderTree,
  Images,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
  Users,
  UsersRound,
} from 'lucide-react';

import useAuth from '../../../hooks/useAuth';

import styles from './Sidebar.module.css';

const NAVIGATION_GROUPS = [
  {
    id: 'general',
    label: 'Principal',

    items: [
      {
        label: 'Dashboard',
        to: '/admin/dashboard',
        icon: LayoutDashboard,
      },
      {
        label: 'Analítica',
        to: '/admin/analytics',
        icon: BarChart3,
      },
    ],
  },

  {
    id: 'content',
    label: 'Contenido',

    items: [
      {
        label: 'Artículos',
        to: '/admin/articulos',
        icon: FileText,
      },
      {
        label: 'Galerías',
        to: '/admin/galerias',
        icon: Images,
      },
      {
        label: 'Ediciones',
        to: '/admin/ediciones',
        icon: BookOpen,
      },
      {
        label: 'Categorías',
        to: '/admin/categorias',
        icon: FolderTree,
      },
      {
        label: 'Colaboradores',
        to: '/admin/colaboradores',
        icon: UsersRound,
      },
      {
        label: 'Sponsors',
        to: '/admin/sponsors',
        icon: Sparkles,
      },
    ],
  },

  {
    id: 'community',
    label: 'Comunidad',

    items: [
      {
        label: 'Convocatorias',
        to: '/admin/convocatorias',
        icon: Megaphone,
      },
      {
        label: 'Comentarios',
        to: '/admin/comentarios',
        icon: MessageSquare,
      },
    ],
  },

  {
    id: 'system',
    label: 'Sistema',

    items: [
      {
        label: 'Usuarios',
        to: '/admin/usuarios',
        icon: Users,
      },
      {
        label: 'Configuración',
        to: '/admin/configuracion',
        icon: Settings,
      },
    ],
  },
];

export default function Sidebar({
  collapsed = false,
  onToggle = null,
  mobileOpen = false,
  onNavigate = null,
}) {
  const {
    user,
    logout,
  } = useAuth();

  const handleNavigation = () => {
    if (
      typeof onNavigate ===
      'function'
    ) {
      onNavigate();
    }
  };

  return (
    <aside
      className={`
        ${styles.sidebar}
        ${
          collapsed
            ? styles.sidebarCollapsed
            : ''
        }
        ${
          mobileOpen
            ? styles.sidebarMobileOpen
            : ''
        }
      `}
      aria-label="Navegación administrativa"
    >
      <header
        className={
          styles.header
        }
      >
        <Link
          to="/"
          className={
            styles.logo
          }
          onClick={
            handleNavigation
          }
        >
          <span
            className={
              styles.logoSymbol
            }
          >
            Λ
          </span>

<div
  className={`
    ${styles.logoText}
    ${
      collapsed
        ? styles.desktopCollapsedOnly
        : ''
    }
  `}
>
  <span
    className={
      styles.logoName
    }
  >
    AGORÁ
  </span>

  <span
    className={
      styles.logoSub
    }
  >
    Panel editorial
  </span>
</div>
        </Link>

        {typeof onToggle ===
          'function' && (
          <button
            type="button"
            className={
              styles.toggleButton
            }
            onClick={onToggle}
            aria-label={
              collapsed
                ? 'Expandir menú'
                : 'Contraer menú'
            }
            title={
              collapsed
                ? 'Expandir menú'
                : 'Contraer menú'
            }
          >
            {collapsed ? (
              <PanelLeftOpen
                size={19}
              />
            ) : (
              <PanelLeftClose
                size={19}
              />
            )}
          </button>
        )}
      </header>

      <div
        className={
          styles.meander
        }
      />

      <nav
        className={
          styles.navigation
        }
      >
        {NAVIGATION_GROUPS.map(
          group => (
            <section
              key={group.id}
              className={
                styles.group
              }
            >
<div
  className={`
    ${styles.groupLabel}
    ${
      collapsed
        ? styles.desktopCollapsedOnly
        : ''
    }
  `}
>
  {group.label}
</div>

              <div
                className={
                  styles.groupItems
                }
              >
                {group.items.map(
                  item => {
                    const Icon =
                      item.icon;

                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={
                          handleNavigation
                        }
                        title={
                          collapsed
                            ? item.label
                            : undefined
                        }
                        className={({
                          isActive,
                        }) => {
                          return `
                            ${styles.navItem}
                            ${
                              isActive
                                ? styles.navItemActive
                                : ''
                            }
                          `;
                        }}
                      >
                        <span
                          className={
                            styles.navIcon
                          }
                        >
                          <Icon
                            size={17}
                          />
                        </span>

<span
  className={`
    ${styles.navLabel}
    ${
      collapsed
        ? styles.desktopCollapsedOnly
        : ''
    }
  `}
>
  {item.label}
</span>
                      </NavLink>
                    );
                  }
                )}
              </div>
            </section>
          )
        )}
      </nav>

      <footer
        className={
          styles.footer
        }
      >
        {user && (
          <div
            className={
              styles.user
            }
          >
            <div
              className={
                styles.avatar
              }
            >
              {user.full_name?.[0]
                ?.toUpperCase() ||
                user.username?.[0]
                  ?.toUpperCase() ||
                'A'}
            </div>

<div
  className={`
    ${styles.userInfo}
    ${
      collapsed
        ? styles.desktopCollapsedOnly
        : ''
    }
  `}
>
  <div
    className={
      styles.userName
    }
  >
    {user.full_name ||
      user.username ||
      'Administrador'}
  </div>

  <div
    className={
      styles.userRole
    }
  >
    {user.role ||
      'admin'}
  </div>
</div>
          </div>
        )}

        <button
          type="button"
          className={
            styles.logoutButton
          }
          onClick={logout}
          title={
            collapsed
              ? 'Cerrar sesión'
              : undefined
          }
        >
          <LogOut
            size={16}
          />

<span
  className={
    collapsed
      ? styles.desktopCollapsedOnly
      : ''
  }
>
  Cerrar sesión
</span>
        </button>
      </footer>
    </aside>
  );
}
import { Link, NavLink } from 'react-router-dom';
import {
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Bell,
  BellOff,
  ChevronDown,
  Menu,
  Search,
  X,
} from 'lucide-react';
import { FaFacebookF, FaInstagram, FaYoutube } from 'react-icons/fa6';
import { SiSubstack } from 'react-icons/si';
import styles from './Navbar.module.css';
import SearchOverlay from '../SearchOverlay/SearchOverlay';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import useThemeStore from '../../../store/themeStore';

import {
  removePushSubscription,
} from '../../../api/notifications.api';

import logoBlack from '../../../assets/AGORABLACK.png';
import logoWhite from '../../../assets/AGORAWHITE.png';
import iconBlack from '../../../assets/AGORAICONBLACK.png';
import iconWhite from '../../../assets/AGORAICONWHITE.png';

const OPEN_PROMPT_EVENT =
  'agora-open-notification-prompt';

const PUSH_STATUS_EVENT =
  'agora-push-status-changed';

const PUSH_ENABLED_KEY =
  'agora_push_enabled';

const SOCIAL_LINKS = [
  {
    key:
      'facebook',

    href:
      'https://facebook.com/agorarevista',

    icon:
      <FaFacebookF size={19} />,

    label:
      'Facebook',
  },

  {
    key:
      'instagram',

    href:
      'https://www.instagram.com/agora_revista/',

    icon:
      <FaInstagram size={20} />,

    label:
      'Instagram',
  },

  {
    key:
      'youtube',

    href:
      'https://www.youtube.com/@agorarevistamx',

    icon:
      <FaYoutube size={21} />,

    label:
      'YouTube',
  },

  {
    key:
      'substack',

    href:
      'https://agorarevista.substack.com',

    icon:
      <SiSubstack size={18} />,

    label:
      'Substack',
  },
];

// ── Estructura fija del menú ──────────────────────────────
const NAV_GROUPS = [
  {
    key: 'ediciones',
    label: 'Ediciones',
    items: [
      { name: 'La revista',           to: '/ediciones' },
      { name: 'Ediciones especiales', to: '/ediciones-especiales' },
    ],
  },
  {
    key: 'secciones',
    label: 'Secciones',
    items: [
      { name: 'Poesía',      to: '/categoria/poesia' },
      { name: 'Narrativa',   to: '/categoria/narrativa' },
      { name: 'Ensayo',      to: '/categoria/ensayo' },
      { name: 'Crítica',     to: '/categoria/critica' },
      { name: 'Pensamiento', to: '/categoria/pensamiento' },
      { name: 'Galería',     to: '/categoria/galeria' },
      { name: 'Entrevista',  to: '/categoria/entrevista' },
      { name: 'Cultural',    to: '/categoria/cultural' },
    ],
  },
  {
    key: 'columnas',
    label: 'Columnas',
    items: [
      { name: 'Artestigo',     to: '/categoria/artestigo' },
      { name: 'Entretanto',    to: '/categoria/entretanto' },
      { name: 'Liceo',         to: '/categoria/liceo' },
      { name: 'Lo que habito', to: '/categoria/lo-que-habito' },
      { name: 'Menguante',     to: '/categoria/menguante' },
      { name: 'Palabrante',    to: '/categoria/palabrante' },
      { name: 'Palimpsesto',   to: '/categoria/palimpsesto' },
      { name: 'Punktum',       to: '/categoria/punktum' },
      { name: 'Vórtice',       to: '/categoria/vortice' },
    ],
  },
];

// Enlaces simples (sin dropdown)
const NAV_LINKS = [
  { name: 'Colaboraciones', to: '/convocatorias' },
  { name: 'Nosotros',       to: '/quienes-somos' },
];

export default function Navbar() {
  const [searchOpen, setSearchOpen] =
    useState(false);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [mobileGroup, setMobileGroup] =
    useState(null);

  const [openGroup, setOpenGroup] =
    useState(null);

  const [pushEnabled, setPushEnabled] =
    useState(false);

  const [pushLoading, setPushLoading] =
    useState(false);

  const [bellRinging, setBellRinging] =
    useState(false);

  const { theme } =
    useThemeStore();

  const timerRef =
    useRef(null);

  const bellTimerRef =
    useRef(null);

  const isDark =
    theme === 'dark';

  const logoSrc =
    isDark
      ? logoWhite
      : logoBlack;

  const iconSrc =
    isDark
      ? iconWhite
      : iconBlack;

  useEffect(() => {
    let cancelled =
      false;

    const refreshPushStatus =
      async () => {
        if (
          !(
            'serviceWorker' in
              navigator
          ) ||
          !(
            'PushManager' in
              window
          ) ||
          !(
            'Notification' in
              window
          )
        ) {
          if (!cancelled) {
            setPushEnabled(
              false
            );
          }

          return;
        }

        try {
          const registration =
            await navigator
              .serviceWorker
              .getRegistration(
                '/push-sw.js'
              );

          const subscription =
            registration
              ? await registration
                  .pushManager
                  .getSubscription()
              : null;

          if (!cancelled) {
            const enabled =
              Notification.permission ===
                'granted' &&
              Boolean(subscription);

            setPushEnabled(
              enabled
            );

            if (enabled) {
              localStorage.setItem(
                PUSH_ENABLED_KEY,
                'true'
              );
            } else {
              localStorage.removeItem(
                PUSH_ENABLED_KEY
              );
            }
          }
        } catch (error) {
          console.error(
            'No se pudo revisar el estado Push:',
            error
          );

          if (!cancelled) {
            setPushEnabled(
              false
            );
          }
        }
      };

    const handleStatusChange =
      event => {
        setPushEnabled(
          Boolean(
            event.detail
              ?.enabled
          )
        );
      };

    const handleServiceWorkerMessage =
      event => {
        if (
          event.data?.type !==
          'AGORA_PUSH_RECEIVED'
        ) {
          return;
        }

        setBellRinging(
          false
        );

        window.requestAnimationFrame(
          () => {
            setBellRinging(
              true
            );
          }
        );

        window.clearTimeout(
          bellTimerRef.current
        );

        bellTimerRef.current =
          window.setTimeout(
            () => {
              setBellRinging(
                false
              );
            },
            1800
          );
      };

    refreshPushStatus();

    window.addEventListener(
      PUSH_STATUS_EVENT,
      handleStatusChange
    );

    navigator
      .serviceWorker
      ?.addEventListener(
        'message',
        handleServiceWorkerMessage
      );

    return () => {
      cancelled =
        true;

      window.removeEventListener(
        PUSH_STATUS_EVENT,
        handleStatusChange
      );

      navigator
        .serviceWorker
        ?.removeEventListener(
          'message',
          handleServiceWorkerMessage
        );

      window.clearTimeout(
        bellTimerRef.current
      );
    };
  }, []);

  const openMenu  = (key) => { clearTimeout(timerRef.current); setOpenGroup(key); };
  const closeMenu = () => { timerRef.current = setTimeout(() => setOpenGroup(null), 120); };
  const keepMenu  = () => clearTimeout(timerRef.current);

  const closeAll = () =>
    setOpenGroup(null);

  const handleNotificationToggle =
    async () => {
      if (pushLoading) {
        return;
      }

      /*
       * Si está silenciada, abrimos el aviso
       * personalizado para solicitar permiso.
       */
      if (!pushEnabled) {
        window.dispatchEvent(
          new Event(
            OPEN_PROMPT_EVENT
          )
        );

        return;
      }

      setPushLoading(true);

      try {
        const registration =
          await navigator
            .serviceWorker
            .getRegistration(
              '/push-sw.js'
            );

        const subscription =
          registration
            ? await registration
                .pushManager
                .getSubscription()
            : null;

        if (subscription) {
          /*
           * Primero eliminamos el endpoint
           * guardado en la base de datos.
           */
          try {
            await removePushSubscription(
              subscription.endpoint
            );
          } catch (error) {
            console.error(
              'No se pudo eliminar la suscripción del backend:',
              error
            );
          }

          /*
           * Después cancelamos la suscripción
           * real del navegador.
           */
          await subscription
            .unsubscribe();
        }

        localStorage.removeItem(
          PUSH_ENABLED_KEY
        );

        setPushEnabled(false);
        setBellRinging(false);

        window.dispatchEvent(
          new CustomEvent(
            PUSH_STATUS_EVENT,
            {
              detail: {
                enabled:
                  false,
              },
            }
          )
        );
      } catch (error) {
        console.error(
          'No se pudieron silenciar las notificaciones:',
          error
        );
      } finally {
        setPushLoading(false);
      }
    };

  // columnas del dropdown según cantidad de items
  const colsFor = (n) => (n <= 3 ? 1 : n <= 6 ? 2 : 3);
  const widthFor = (cols) => (cols === 1 ? 220 : cols === 2 ? 340 : 500);

  return (
    <>
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200 }}>
        <nav className={styles.navbar}>
          <div className={styles.inner}>

            {/* Logo — izquierda */}
            <Link to="/" className={styles.logo} onClick={closeAll}>
              <img src={logoSrc} alt="Agorá Revista" className={styles.logoImg} />
              <img src={iconSrc} alt="Agorá" className={styles.logoIcon} />
            </Link>

            {/* Nav — centro */}
            <nav className={styles.nav}>

              {NAV_GROUPS.map(group => {
                const cols = colsFor(group.items.length);
                const isOpen = openGroup === group.key;
                return (
                  <div
                    key={group.key}
                    className={styles.navItem}
                    onMouseEnter={() => openMenu(group.key)}
                    onMouseLeave={closeMenu}
                  >
                    <div
                      className={`${styles.navGroupTrigger} ${
                        isOpen ? styles.navActive : ''
                      }`}
                    >
                      {group.key === 'columnas' ? (
                        <NavLink
                          to="/columnas"
                          className={({ isActive }) =>
                            `${styles.navGroupLabel} ${
                              isActive ? styles.navActive : ''
                            }`
                          }
                          onClick={closeAll}
                        >
                          {group.label}
                        </NavLink>
                      ) : (
                        <button
                          type="button"
                          className={styles.navGroupLabel}
                          onClick={() =>
                            setOpenGroup(previous =>
                              previous === group.key
                                ? null
                                : group.key
                            )
                          }
                        >
                          {group.label}
                        </button>
                      )}

                      <button
                        type="button"
                        className={styles.navGroupChevronButton}
                        onClick={() =>
                          setOpenGroup(previous =>
                            previous === group.key
                              ? null
                              : group.key
                          )
                        }
                        aria-label={`Abrir menú de ${group.label}`}
                        aria-expanded={isOpen}
                      >
                        <ChevronDown
                          size={11}
                          className={`${styles.chevron} ${
                            isOpen
                              ? styles.chevronOpen
                              : ''
                          }`}
                        />
                      </button>
                    </div>

                    {isOpen && (
                      <div
                        className={styles.dropdown}
                        style={{ minWidth: widthFor(cols) }}
                        onMouseEnter={keepMenu}
                        onMouseLeave={closeMenu}
                      >
                        <div
                          className={styles.dropdownGrid}
                          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                        >
                          {group.items.map(item => (
                            <Link
                              key={item.to}
                              to={item.to}
                              className={styles.dropLink}
                              onClick={closeAll}
                            >
                              {item.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {NAV_LINKS.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navActive : ''}`}
                  onClick={closeAll}
                >
                  {link.name}
                </NavLink>
              ))}

            </nav>

            {/* Acciones — derecha */}
            <div className={styles.actions}>

            {/* Redes sociales */}
            <div className={styles.socials}>
              {SOCIAL_LINKS.map(s => (
                <a
                  key={s.key}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialBtn}
                  aria-label={s.label}
                  title={s.label}
                >
                  {s.icon}
                </a>
              ))}
            </div>
              <div className={styles.actionsDivider} />

              <button
                type="button"
                className={[
                  styles.notificationBtn,

                  pushEnabled
                    ? styles.notificationEnabled
                    : styles.notificationMuted,

                  bellRinging
                    ? styles.notificationRinging
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={
                  handleNotificationToggle
                }
                disabled={
                  pushLoading
                }
                aria-label={
                  pushEnabled
                    ? 'Silenciar notificaciones'
                    : 'Activar notificaciones'
                }
                aria-pressed={
                  pushEnabled
                }
                title={
                  pushEnabled
                    ? 'Notificaciones activadas. Pulsa para silenciarlas.'
                    : 'Notificaciones silenciadas. Pulsa para activarlas.'
                }
              >
                {pushEnabled ? (
                  <Bell
                    size={18}
                    className={
                      styles.notificationIcon
                    }
                  />
                ) : (
                  <BellOff
                    size={18}
                    className={
                      styles.notificationIcon
                    }
                  />
                )}

                {pushEnabled && (
                  <span
                    className={
                      styles.notificationStatusDot
                    }
                    aria-hidden="true"
                  />
                )}
              </button>

              <ThemeToggle />

              <button
                className={styles.searchBtn}
                onClick={() => setSearchOpen(true)}
                aria-label="Buscar"
              >
                <Search size={18} />
              </button>

              <button className={styles.menuBtn} onClick={() => setMobileOpen(p => !p)}>
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

          </div>
          <div className={styles.meander} />
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className={styles.mobileMenu}>

            {NAV_GROUPS.map(group => {
              const isMobileGroupOpen =
                mobileGroup === group.key;

              return (
                <div
                  key={group.key}
                  className={styles.mobileSection}
                >
                  {group.key === 'columnas' ? (
                    <div className={styles.mobileSectionHeader}>
                      <NavLink
                        to="/columnas"
                        className={({ isActive }) =>
                          `${styles.mobileSectionTitle} ${
                            isActive
                              ? styles.navActive
                              : ''
                          }`
                        }
                        onClick={() => {
                          setMobileOpen(false);
                          setMobileGroup(null);
                        }}
                      >
                        {group.label}
                      </NavLink>

                      <button
                        type="button"
                        className={styles.mobileSectionToggle}
                        onClick={() =>
                          setMobileGroup(current =>
                            current === group.key
                              ? null
                              : group.key
                          )
                        }
                        aria-label="Mostrar columnas"
                        aria-expanded={isMobileGroupOpen}
                      >
                        <ChevronDown
                          size={15}
                          style={{
                            transform:
                              isMobileGroupOpen
                                ? 'rotate(180deg)'
                                : 'none',
                            transition:
                              'transform 0.2s',
                          }}
                        />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={styles.mobileSectionBtn}
                      onClick={() =>
                        setMobileGroup(current =>
                          current === group.key
                            ? null
                            : group.key
                        )
                      }
                    >
                      {group.label}

                      <ChevronDown
                        size={13}
                        style={{
                          transform:
                            isMobileGroupOpen
                              ? 'rotate(180deg)'
                              : 'none',
                          transition:
                            'transform 0.2s',
                        }}
                      />
                    </button>
                  )}

                  {isMobileGroupOpen && (
                    <div className={styles.mobileSubs}>
                      {group.items.map(item => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={styles.mobileSub}
                          onClick={() => {
                            setMobileOpen(false);
                            setMobileGroup(null);
                          }}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {NAV_LINKS.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={styles.mobileLink}
                onClick={() => setMobileOpen(false)}
              >
                {link.name}
              </NavLink>
            ))}

            {/* Redes en mobile */}
            <div className={styles.mobileSocials}>
              {SOCIAL_LINKS.map(s => (
                <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" className={styles.mobileSocialBtn} aria-label={s.label}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
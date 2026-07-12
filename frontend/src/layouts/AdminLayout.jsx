import {
  useEffect,
  useState,
} from 'react';

import {
  Outlet,
} from 'react-router-dom';

import {
  Menu,
  X,
} from 'lucide-react';

import Sidebar from '../components/admin/Sidebar/Sidebar';

import styles from './AdminLayout.module.css';

const SIDEBAR_STORAGE_KEY =
  'agora_admin_sidebar_collapsed';

export default function AdminLayout() {
  const [
    collapsed,
    setCollapsed,
  ] = useState(() => {
    try {
      return (
        localStorage.getItem(
          SIDEBAR_STORAGE_KEY
        ) === 'true'
      );
    } catch {
      return false;
    }
  });

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const handleToggle =
    () => {
      setCollapsed(
        current =>
          !current
      );
    };

  useEffect(() => {
    try {
      localStorage.setItem(
        SIDEBAR_STORAGE_KEY,
        String(collapsed)
      );
    } catch {
      // El panel funciona aunque
      // localStorage no esté disponible.
    }
  }, [collapsed]);

  useEffect(() => {
    if (!mobileOpen) {
      return undefined;
    }

    const handleKeyDown =
      event => {
        if (
          event.key ===
          'Escape'
        ) {
          setMobileOpen(
            false
          );
        }
      };

    document.addEventListener(
      'keydown',
      handleKeyDown
    );

    document.body.style.overflow =
      'hidden';

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown
      );

      document.body.style.overflow =
        '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    const handleResize =
      () => {
        if (
          window.innerWidth >
          900
        ) {
          setMobileOpen(
            false
          );
        }
      };

    window.addEventListener(
      'resize',
      handleResize
    );

    return () => {
      window.removeEventListener(
        'resize',
        handleResize
      );
    };
  }, []);

  return (
    <div
      className={`
        ${styles.layout}
        ${
          collapsed
            ? styles.layoutCollapsed
            : ''
        }
      `}
    >
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggle={
          handleToggle
        }
        onNavigate={() => {
          setMobileOpen(
            false
          );
        }}
      />

      {mobileOpen && (
        <button
          type="button"
          className={
            styles.mobileBackdrop
          }
          onClick={() => {
            setMobileOpen(
              false
            );
          }}
          aria-label="Cerrar menú"
        />
      )}

      <header
        className={
          styles.mobileHeader
        }
      >
        <button
          type="button"
          className={
            styles.mobileMenuButton
          }
          onClick={() => {
            setMobileOpen(
              current =>
                !current
            );
          }}
          aria-label={
            mobileOpen
              ? 'Cerrar menú'
              : 'Abrir menú'
          }
        >
          {mobileOpen ? (
            <X size={21} />
          ) : (
            <Menu size={21} />
          )}
        </button>

        <div
          className={
            styles.mobileBrand
          }
        >
          <strong>
            AGORÁ
          </strong>

          <span>
            Panel editorial
          </span>
        </div>
      </header>

      <main
        className={
          styles.content
        }
      >
        <Outlet />
      </main>
    </div>
  );
}
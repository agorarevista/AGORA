import { Link, NavLink } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { Search, X, Menu, ChevronDown } from 'lucide-react';
import styles from './Navbar.module.css';
import { getCategories } from '../../../api/categories.api';
import { getCurrentEdition } from '../../../api/editions.api';
import { cacheGet, cacheSet } from '../../../utils/cache';
import SearchOverlay from '../SearchOverlay/SearchOverlay';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import useThemeStore from '../../../store/themeStore';

import logoBlack from '../../../assets/AGORABLACK.png';
import logoWhite from '../../../assets/AGORAWHITE.png';
import iconBlack from '../../../assets/AGORAICONBLACK.png';
import iconWhite from '../../../assets/AGORAICONWHITE.png';

export default function Navbar() {
  const [categories, setCategories]     = useState([]);
  const [currentEdition, setCurrentEdition] = useState(null);
  const [searchOpen, setSearchOpen]     = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [mobileSecOpen, setMobileSecOpen] = useState(false);
  const [secOpen, setSecOpen]           = useState(false);
  const { theme } = useThemeStore();
  const timerRef  = useRef(null);

  const isDark  = theme === 'dark';
  const logoSrc = isDark ? logoWhite : logoBlack;
  const iconSrc = isDark ? iconWhite : iconBlack;

  useEffect(() => {
    const cachedCats = cacheGet('categories');
    if (cachedCats) setCategories(cachedCats);
    else {
      getCategories().then(data => {
        setCategories(data);
        cacheSet('categories', data);
      }).catch(() => {});
    }

    const cachedEd = cacheGet('current_edition');
    if (cachedEd) setCurrentEdition(cachedEd);
    else {
      getCurrentEdition().then(data => {
        setCurrentEdition(data);
        cacheSet('current_edition', data);
      }).catch(() => {});
    }
  }, []);

  const openSec  = () => { clearTimeout(timerRef.current); setSecOpen(true); };
  const closeSec = () => { timerRef.current = setTimeout(() => setSecOpen(false), 120); };
  const keepSec  = () => clearTimeout(timerRef.current);

  return (
    <>
<header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200 }}>
        <nav className={styles.navbar}>
          <div className={styles.inner}>

            {/* Logo — izquierda */}
            <Link to="/" className={styles.logo} onClick={() => setSecOpen(false)}>
              <img src={logoSrc} alt="Agorá Revista" className={styles.logoImg} />
              <img src={iconSrc} alt="Agorá" className={styles.logoIcon} />
            </Link>

            {/* Nav — centro */}
            <nav className={styles.nav}>

              <NavLink to="/ediciones" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navActive : ''}`} onClick={() => setSecOpen(false)}>
                Edición
              </NavLink>

              {/* Secciones — único con dropdown */}
              <div
                className={styles.navItem}
                onMouseEnter={openSec}
                onMouseLeave={closeSec}
              >
                <button
                  className={`${styles.navLink} ${secOpen ? styles.navActive : ''}`}
                  onClick={() => setSecOpen(p => !p)}
                >
                  Secciones
                  <ChevronDown size={11} className={`${styles.chevron} ${secOpen ? styles.chevronOpen : ''}`} />
                </button>

                {secOpen && (
                  <div
                    className={styles.dropdown}
                    onMouseEnter={keepSec}
                    onMouseLeave={closeSec}
                  >
                    <div className={styles.dropdownGrid}>
                      {categories.map(cat => (
                        <Link
                          key={cat.id}
                          to={`/categoria/${cat.slug}`}
                          className={styles.dropLink}
                          onClick={() => setSecOpen(false)}
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <NavLink to="/archivo" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navActive : ''}`} onClick={() => setSecOpen(false)}>
                Archivo
              </NavLink>

              <NavLink to="/ediciones-especiales" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navActive : ''}`} onClick={() => setSecOpen(false)}>
                Ed. especiales
              </NavLink>

              <NavLink to="/quienes-somos" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navActive : ''}`} onClick={() => setSecOpen(false)}>
                Nosotros
              </NavLink>

            </nav>

            {/* Acciones — derecha */}
            <div className={styles.actions}>
              <ThemeToggle />
              <button
                className={styles.searchBtn}
                onClick={() => setSearchOpen(true)}
                aria-label="Buscar"
              >
                <Search size={18} />
              </button>
{currentEdition && (
                <Link to="/ediciones" className={styles.editionBadge}>
                  ED. {currentEdition.number}
                </Link>
              )}
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
            <NavLink to="/ediciones" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Edición</NavLink>

            <div className={styles.mobileSection}>
              <button className={styles.mobileSectionBtn} onClick={() => setMobileSecOpen(p => !p)}>
                Secciones
                <ChevronDown size={13} style={{ transform: mobileSecOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {mobileSecOpen && (
                <div className={styles.mobileSubs}>
                  {categories.map(cat => (
                    <Link key={cat.id} to={`/categoria/${cat.slug}`} className={styles.mobileSub} onClick={() => setMobileOpen(false)}>
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <NavLink to="/archivo" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Archivo</NavLink>
            <NavLink to="/ediciones-especiales" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Ediciones especiales</NavLink>
            <NavLink to="/quienes-somos" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Nosotros</NavLink>
          </div>
        )}
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
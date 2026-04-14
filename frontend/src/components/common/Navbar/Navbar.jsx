import { Link, NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Search, X, Menu, ChevronDown } from 'lucide-react';
import styles from './Navbar.module.css';
import { getCategories } from '../../../api/categories.api';
import { getCurrentEdition } from '../../../api/editions.api';
import { cacheGet, cacheSet } from '../../../utils/cache';
import SearchOverlay from '../SearchOverlay/SearchOverlay';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import useThemeStore from '../../../store/themeStore';

// Importar logos
import logoBlack from '../../../assets/AGORABLACK.png';
import logoWhite from '../../../assets/AGORAWHITE.png';
import iconBlack from '../../../assets/AGORAICONBLACK.png';
import iconWhite from '../../../assets/AGORAICONWHITE.png';

export default function Navbar() {
  const [categories, setCategories]         = useState([]);
  const [currentEdition, setCurrentEdition] = useState(null);
  const [searchOpen, setSearchOpen]         = useState(false);
  const [mobileOpen, setMobileOpen]         = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState({});
  const { theme } = useThemeStore();

  const isDark  = theme === 'dark';
  const logoSrc = isDark ? logoWhite : logoBlack;
  const iconSrc = isDark ? iconWhite : iconBlack;

  const VISIBLE = 6;
  const visible = categories.slice(0, VISIBLE);
  const hidden  = categories.slice(VISIBLE);

  useEffect(() => {
    const cached = cacheGet('categories');
    if (cached) { setCategories(cached); }
    else {
      getCategories().then(data => {
        setCategories(data);
        cacheSet('categories', data);
      }).catch(() => {});
    }

    const cachedEd = cacheGet('current_edition');
    if (cachedEd) { setCurrentEdition(cachedEd); }
    else {
      getCurrentEdition().then(data => {
        setCurrentEdition(data);
        cacheSet('current_edition', data);
      }).catch(() => {});
    }
  }, []);

  const toggleMobileSection = (id) => {
    setMobileExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const NavItem = ({ cat }) => (
    <div className={styles.navItem}>
      <NavLink
        to={`/categoria/${cat.slug}`}
        className={({ isActive }) =>
          `${styles.navLink} ${isActive ? styles.active : ''}`
        }
      >
        {cat.name}
        <ChevronDown size={10} className={styles.chevron} />
      </NavLink>
      <div className={styles.dropdown}>
        <Link
          to={`/categoria/${cat.slug}`}
          className={`${styles.dropdownLink} ${styles.dropdownAll}`}
        >
          ❧ Ver todo en {cat.name}
        </Link>
        {cat.subcategories && cat.subcategories.length > 0 && (
          <>
            <div className={styles.dropdownDivider} />
            {cat.subcategories.map(sub => (
              <Link
                key={sub.id}
                to={`/categoria/${sub.slug}`}
                className={styles.dropdownLink}
              >
                {sub.name}
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <header>
        <nav className={styles.navbar}>
          <div className={styles.inner}>

            {/* Logo — cambia según tema y dispositivo */}
            <Link to="/" className={styles.logo}>
              <img
                src={logoSrc}
                alt="Agorá Revista"
                className={styles.logoImg}
              />
              <img
                src={iconSrc}
                alt="Agorá"
                className={styles.logoIcon}
              />
            </Link>

            <nav className={styles.nav}>
              {visible.map(cat => (
                <NavItem key={cat.id} cat={cat} />
              ))}
              {hidden.length > 0 && (
                <div className={styles.navItem}>
                  <span className={styles.navLink}>
                    Más <ChevronDown size={10} className={styles.chevron} />
                  </span>
                  <div className={styles.dropdown}>
                    {hidden.map(cat => (
                      <div key={cat.id}>
                        <Link
                          to={`/categoria/${cat.slug}`}
                          className={`${styles.dropdownLink} ${styles.dropdownAll}`}
                        >
                          {cat.name}
                        </Link>
                        {cat.subcategories?.map(sub => (
                          <Link
                            key={sub.id}
                            to={`/categoria/${sub.slug}`}
                            className={`${styles.dropdownLink} ${styles.dropdownSub}`}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </nav>

            <div className={styles.actions}>
              <ThemeToggle />
              <button
                className={styles.searchBtn}
                onClick={() => setSearchOpen(true)}
                aria-label="Buscar"
              >
                <Search size={17} />
              </button>
              {currentEdition && (
                <Link to={`/edicion/${currentEdition.number}`} className={styles.editionBadge}>
                  Ed. {currentEdition.number}
                </Link>
              )}
              <button className={styles.menuBtn} onClick={() => setMobileOpen(p => !p)}>
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
          <div className={styles.meander} />
        </nav>

        {mobileOpen && (
          <div className={styles.mobileMenu}>
            {categories.map(cat => (
              <div key={cat.id}>
                <div className={styles.mobileSectionRow}>
                  <NavLink
                    to={`/categoria/${cat.slug}`}
                    className={({ isActive }) =>
                      `${styles.mobileLink} ${isActive ? styles.mobileActive : ''}`
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    {cat.name}
                  </NavLink>
                  {cat.subcategories?.length > 0 && (
                    <button
                      className={styles.mobileToggle}
                      onClick={() => toggleMobileSection(cat.id)}
                    >
                      <ChevronDown
                        size={14}
                        style={{
                          transform: mobileExpanded[cat.id] ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s'
                        }}
                      />
                    </button>
                  )}
                </div>
                {cat.subcategories?.length > 0 && mobileExpanded[cat.id] && (
                  <div className={styles.mobileSubs}>
                    {cat.subcategories.map(sub => (
                      <NavLink
                        key={sub.id}
                        to={`/categoria/${sub.slug}`}
                        className={styles.mobileSub}
                        onClick={() => setMobileOpen(false)}
                      >
                        {sub.name}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
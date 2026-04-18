import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Navbar from '../components/common/Navbar/Navbar';
import Footer from '../components/common/Footer/Footer';
import PageTransition from '../components/common/PageTransition/PageTransition';
import ScrollToTopButton from '../components/common/ScrollToTopButton/ScrollToTopButton';
import { trackView } from '../api/analytics.api';

export default function PublicLayout() {
  const location = useLocation();
  const navbarRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    trackView({ path: location.pathname }).catch(() => {});
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (!navbarRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowScrollTop(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0.05,
      }
    );

    observer.observe(navbarRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div ref={navbarRef}>
        <Navbar />
      </div>

      <main style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>

      <Footer />
      <ScrollToTopButton visible={showScrollTop} />
    </div>
  );
}
import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from '../components/common/Navbar/Navbar';
import Footer from '../components/common/Footer/Footer';
import PageTransition from '../components/common/PageTransition/PageTransition';
import ScrollToTopButton from '../components/common/ScrollToTopButton/ScrollToTopButton';
import { trackView } from '../api/analytics.api';

export default function PublicLayout() {
  const location = useLocation();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    trackView({ path: location.pathname }).catch(() => {});
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Navbar renderizado en el body directamente — fuera de cualquier transform context */}
      {createPortal(<Navbar />, document.body)}

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <main style={{ flex: 1 }}>
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>

        <Footer />
      </div>

      {createPortal(
        <ScrollToTopButton visible={showScrollTop} />,
        document.body
      )}
    </>
  );
}
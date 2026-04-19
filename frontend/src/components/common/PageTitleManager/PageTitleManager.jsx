import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function prettifySlug(slug = '') {
  return decodeURIComponent(slug)
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function PageTitleManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    let title = 'AGORA | HOME';

    if (pathname === '/') {
      title = 'AGORA | HOME';
    } else if (pathname === '/admin/login') {
      title = 'AGORA | LOGIN';
    } else if (pathname.startsWith('/admin')) {
      title = 'AGORA | ADMIN';
    } else if (pathname.startsWith('/articulos/')) {
      const slug = pathname.replace('/articulos/', '');
      title = `AGORA | ${prettifySlug(slug)}`;
    } else if (pathname.startsWith('/categoria/')) {
      const slug = pathname.replace('/categoria/', '');
      title = `AGORA | ${prettifySlug(slug)}`;
    } else if (pathname.startsWith('/colaborador/')) {
      const slug = pathname.replace('/colaborador/', '');
      title = `AGORA | ${prettifySlug(slug)}`;
    } else if (pathname.startsWith('/edicion/')) {
      const slug = pathname.replace('/edicion/', '');
      title = `AGORA | EDICIÓN ${prettifySlug(slug)}`;
    } else if (pathname.startsWith('/buscar')) {
      title = 'AGORA | BÚSQUEDA';
    } else if (pathname.startsWith('/convocatoria/')) {
      const id = pathname.replace('/convocatoria/', '');
      title = `AGORA | CONVOCATORIA ${prettifySlug(id)}`;
    } else {
      const cleanPath = pathname.replace(/^\/+|\/+$/g, '');
      title = cleanPath ? `AGORA | ${prettifySlug(cleanPath)}` : 'AGORA | HOME';
    }

    document.title = title;
  }, [pathname]);

  return null;
}
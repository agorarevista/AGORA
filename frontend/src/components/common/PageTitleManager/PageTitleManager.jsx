import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function prettifySlug(slug = '') {
  return decodeURIComponent(slug)
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, letter =>
      letter.toLocaleUpperCase('es-MX')
    );
}

export default function PageTitleManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    let title = 'Agorá Revista';

    if (pathname === '/') {
      title = 'Agorá Revista';
    } else if (pathname === '/admin/login') {
      title = 'Agorá Revista | Login';
    } else if (pathname.startsWith('/admin')) {
      title = 'Agorá Revista | Administración';
    } else if (pathname.startsWith('/articulos/')) {
      return;
    } else if (pathname.startsWith('/categoria/')) {
      const slug = pathname.replace('/categoria/', '');

      title = `Agorá Revista | ${prettifySlug(slug)}`;
    } else if (pathname.startsWith('/colaborador/')) {
      const slug = pathname.replace('/colaborador/', '');

      title = `Agorá Revista | ${prettifySlug(slug)}`;
    } else if (pathname.startsWith('/edicion/')) {
      const slug = pathname.replace('/edicion/', '');

      title = `Agorá Revista | Edición ${prettifySlug(slug)}`;
    } else if (pathname === '/ediciones') {
      title = 'Agorá Revista | Ediciones';
    } else if (pathname === '/ediciones-especiales') {
      title = 'Agorá Revista | Ediciones especiales';
    } else if (pathname === '/archivo') {
      title = 'Agorá Revista | Archivo';
    } else if (pathname === '/columnas') {
      title = 'Agorá Revista | Columnas';
    } else if (pathname === '/galeria') {
      title = 'Agorá Revista | Galería';
    } else if (pathname.startsWith('/galeria/')) {
      const slug = pathname.replace('/galeria/', '');

      title = `Agorá Revista | ${prettifySlug(slug)}`;
    } else if (pathname === '/convocatorias') {
      title = 'Agorá Revista | Convocatorias';
    } else if (pathname.startsWith('/convocatoria/')) {
      const id = pathname.replace('/convocatoria/', '');

      title = `Agorá Revista | Convocatoria ${prettifySlug(id)}`;
    } else if (pathname === '/quienes-somos') {
      title = 'Agorá Revista | Quiénes somos';
    } else if (pathname.startsWith('/buscar')) {
      title = 'Agorá Revista | Búsqueda';
    } else {
      const cleanPath =
        pathname.replace(
          /^\/+|\/+$/g,
          ''
        );

      title = cleanPath
        ? `Agorá Revista | ${prettifySlug(cleanPath)}`
        : 'Agorá Revista';
    }

    document.title = title;
  }, [pathname]);

  return null;
}
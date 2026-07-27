import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from 'react-router-dom';

import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

import PageTitleManager from './components/common/PageTitleManager/PageTitleManager';

// Públicas
import HomePage from './pages/public/HomePage';
import ArticlePage from './pages/public/ArticlePage';
import CategoryPage from './pages/public/CategoryPage';
import CollaboratorPage from './pages/public/CollaboratorPage';
import PublicCollaboratorsPage from './pages/public/CollaboratorsPage';
import EditionPage from './pages/public/EditionPage';
import SearchPage from './pages/public/SearchPage';
import CollaborationsPage from './pages/public/CollaborationsPage';
import AboutPage from './pages/public/AboutPage';
import EdicionesPage from './pages/public/EdicionesPage';
import ArchivoPage from './pages/public/ArchivoPage';
import EdicionesEspecialesPage from './pages/public/EdicionesEspecialesPage';
import ColumnsPage from './pages/public/ColumnsPage';
import PublicGalleriesPage from './pages/public/GalleriesPage';
import GalleryPage from './pages/public/GalleryPage';

// Administración
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import ArticlesPage from './pages/admin/ArticlesPage';
import ArticleEditorPage from './pages/admin/ArticleEditorPage';
import GalleriesPage from './pages/admin/GalleriesPage';
import GalleryEditorPage from './pages/admin/GalleryEditorPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import AdminCollaboratorsPage from './pages/admin/CollaboratorsPage';
import EditionsPage from './pages/admin/EditionsPage';
import ConvocatoriasPage from './pages/admin/ConvocatoriasPage';
import CommentsPage from './pages/admin/CommentsPage';
import UsersPage from './pages/admin/UsersPage';
import SettingsPage from './pages/admin/SettingsPage';
import SeoPage from './pages/admin/SeoPage';
import SponsorsPage from './pages/admin/SponsorsPage';

import useAuthStore from './store/authStore';

const RequireAuth = ({
  children,
}) => {
  const { token } =
    useAuthStore();

  if (!token) {
    return (
      <Navigate
        to="/admin/login"
        replace
      />
    );
  }

  return children;
};

function TitleLayout() {
  return (
    <>
      <PageTitleManager />
      <Outlet />
    </>
  );
}

const router =
  createBrowserRouter([
    {
      path: '/',
      element:
        <TitleLayout />,

      children: [
        {
          path: '/',
          element:
            <PublicLayout />,

          children: [
            {
              index: true,
              element:
                <HomePage />,
            },
            {
              path:
                'articulos/:slug',
              element:
                <ArticlePage />,
            },
{
  path:
    'categoria/galeria',
  element:
    <PublicGalleriesPage />,
},
{
  path:
    'galeria',
  element:
    <PublicGalleriesPage />,
},
{
  path:
    'galeria/:slug',
  element:
    <GalleryPage />,
},
{
  path:
    'categoria/:slug',
  element:
    <CategoryPage />,
},
{
  path:
    'colaborador/:slug',
  element:
    <CollaboratorPage />,
},
{
  path:
    'colaboradores',
  element:
    <PublicCollaboratorsPage />,
},
            {
              path:
                'edicion/:number',
              element:
                <EditionPage />,
            },
            {
              path: 'buscar',
              element:
                <SearchPage />,
            },
            {
              path:
                'convocatorias',
              element:
                <CollaborationsPage />,
            },
            {
              path:
                'colaboraciones',
              element:
                <Navigate
                  to="/convocatorias"
                  replace
                />,
            },
            {
              path:
                'quienes-somos',
              element:
                <AboutPage />,
            },
            {
              path: 'ediciones',
              element:
                <EdicionesPage />,
            },
            {
              path: 'archivo',
              element:
                <ArchivoPage />,
            },
            {
              path:
                'ediciones-especiales',
              element:
                <EdicionesEspecialesPage />,
            },
            {
              path: 'columnas',
              element:
                <ColumnsPage />,
            },
          ],
        },

        {
          path: 'admin/login',
          element:
            <LoginPage />,
        },

        {
          path: 'admin',
          element:
            (
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            ),

          children: [
            {
              index: true,
              element:
                <Navigate
                  to="/admin/dashboard"
                  replace
                />,
            },
            {
              path: 'dashboard',
              element:
                <DashboardPage />,
            },
            {
              path: 'analytics',
              element:
                <AnalyticsPage />,
            },
{
  path: 'articulos',
  element:
    <ArticlesPage />,
},
{
  path:
    'articulos/nuevo',
  element:
    <ArticleEditorPage />,
},
{
  path:
    'articulos/editar/:id',
  element:
    <ArticleEditorPage />,
},

{
  path: 'galerias',
  element:
    <GalleriesPage />,
},

{
  path:
    'galerias/nueva',
  element:
    <GalleryEditorPage />,
},

{
  path:
    'galerias/editar/:id',
  element:
    <GalleryEditorPage />,
},

{
  path: 'categorias',
  element:
    <CategoriesPage />,
},
            {
              path:
                'colaboradores',
              element:
                <AdminCollaboratorsPage />,
            },
            {
              path: 'ediciones',
              element:
                <EditionsPage />,
            },
            {
              path:
                'convocatorias',
              element:
                <ConvocatoriasPage />,
            },
            {
              path: 'sponsors',
              element:
                <SponsorsPage />,
            },
            {
              path: 'comentarios',
              element:
                <CommentsPage />,
            },
            {
              path: 'usuarios',
              element:
                <UsersPage />,
            },
            {
              path: 'seo',
              element:
                <SeoPage />,
            },
            {
              path:
                'configuracion',
              element:
                <SettingsPage />,
            },
          ],
        },

        {
          path: '*',
          element:
            <Navigate
              to="/"
              replace
            />,
        },
      ],
    },
  ]);

export default function Router() {
  return (
    <RouterProvider
      router={router}
    />
  );
}
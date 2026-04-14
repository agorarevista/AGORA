import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Páginas públicas
import HomePage from './pages/public/HomePage';
import ArticlePage from './pages/public/ArticlePage';
import CategoryPage from './pages/public/CategoryPage';
import CollaboratorPage from './pages/public/CollaboratorPage';
import EditionPage from './pages/public/EditionPage';
import SearchPage from './pages/public/SearchPage';
import ConvocatoriaPage from './pages/public/ConvocatoriaPage';

// Páginas admin
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import ArticlesPage from './pages/admin/ArticlesPage';
import ArticleEditorPage from './pages/admin/ArticleEditorPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import CollaboratorsPage from './pages/admin/CollaboratorsPage';
import EditionsPage from './pages/admin/EditionsPage';
import ConvocatoriasPage from './pages/admin/ConvocatoriasPage';
import SubmissionsPage from './pages/admin/SubmissionsPage';
import CommentsPage from './pages/admin/CommentsPage';
import UsersPage from './pages/admin/UsersPage';
import SettingsPage from './pages/admin/SettingsPage';

import useAuthStore from './store/authStore';

// Guard para rutas admin
const RequireAuth = ({ children }) => {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
};

const router = createBrowserRouter([
  // ── Rutas públicas ────────────────────────────────────────────
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true,                      element: <HomePage /> },
      { path: 'articulos/:slug',          element: <ArticlePage /> },
      { path: 'categoria/:slug',          element: <CategoryPage /> },
      { path: 'colaborador/:slug',        element: <CollaboratorPage /> },
      { path: 'edicion/:number',          element: <EditionPage /> },
      { path: 'buscar',                   element: <SearchPage /> },
      { path: 'convocatoria/:id',         element: <ConvocatoriaPage /> },
    ]
  },

  // ── Login admin (sin layout admin) ────────────────────────────
  { path: '/admin/login', element: <LoginPage /> },

  // ── Rutas admin protegidas ────────────────────────────────────
  {
    path: '/admin',
    element: <RequireAuth><AdminLayout /></RequireAuth>,
    children: [
      { index: true,                      element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard',                element: <DashboardPage /> },
      { path: 'analytics',                element: <AnalyticsPage /> },
      { path: 'articulos',                element: <ArticlesPage /> },
      { path: 'articulos/nuevo',          element: <ArticleEditorPage /> },
      { path: 'articulos/editar/:id',     element: <ArticleEditorPage /> },
      { path: 'categorias',               element: <CategoriesPage /> },
      { path: 'colaboradores',            element: <CollaboratorsPage /> },
      { path: 'ediciones',                element: <EditionsPage /> },
      { path: 'convocatorias',            element: <ConvocatoriasPage /> },
      { path: 'convocatorias/:id/envios', element: <SubmissionsPage /> },
      { path: 'comentarios',             element: <CommentsPage /> },
      { path: 'usuarios',                element: <UsersPage /> },
      { path: 'configuracion',           element: <SettingsPage /> },
    ]
  },

  // ── 404 ───────────────────────────────────────────────────────
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}
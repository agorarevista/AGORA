import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PageTitleManager from './components/common/PageTitleManager/PageTitleManager';
import HomePage from './pages/HomePage/HomePage';
import AdminPage from './pages/AdminPage/AdminPage';
import ArticlePage from './pages/ArticlePage/ArticlePage';
import SectionPage from './pages/SectionPage/SectionPage';
import CollaboratorPage from './pages/CollaboratorPage/CollaboratorPage';

function App() {
  return (
    <BrowserRouter>
      <PageTitleManager />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/articulos/:slug" element={<ArticlePage />} />
        <Route path="/seccion/:slug" element={<SectionPage />} />
        <Route path="/colaborador/:slug" element={<CollaboratorPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
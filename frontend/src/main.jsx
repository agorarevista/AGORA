import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import Router from './router';
import Alert from './components/common/Alert/Alert';

// Aplicar tema ANTES de renderizar — evita flash de modo incorrecto
(function() {
  try {
    const saved = localStorage.getItem('agora_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch {}
})();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Alert />
    <Router />
  </StrictMode>
);
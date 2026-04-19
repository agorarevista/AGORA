import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
});

// Agregar token JWT a cada request si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agora_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('agora_token');
      localStorage.removeItem('agora_user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default api;
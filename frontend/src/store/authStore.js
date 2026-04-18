import { create } from 'zustand';

const shouldRememberSession = () =>
  localStorage.getItem('agora_remember_session') === 'true';

const getInitialToken = () => {
  if (!shouldRememberSession()) return null;
  return localStorage.getItem('agora_token') || null;
};

const getInitialUser = () => {
  if (!shouldRememberSession()) return null;
  return JSON.parse(localStorage.getItem('agora_user') || 'null');
};

const useAuthStore = create((set) => ({
  token: getInitialToken(),
  user: getInitialUser(),

  login: (token, user) => {
    if (shouldRememberSession()) {
      localStorage.setItem('agora_token', token);
      localStorage.setItem('agora_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('agora_token');
      localStorage.removeItem('agora_user');
    }

    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem('agora_token');
    localStorage.removeItem('agora_user');
    set({ token: null, user: null });
  },

  updateUser: (user) => {
    if (shouldRememberSession()) {
      localStorage.setItem('agora_user', JSON.stringify(user));
    }
    set({ user });
  },
}));

export default useAuthStore;
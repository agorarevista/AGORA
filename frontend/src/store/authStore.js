import { create } from 'zustand';

const useAuthStore = create((set) => ({
  token: localStorage.getItem('agora_token') || null,
  user: JSON.parse(localStorage.getItem('agora_user') || 'null'),

  login: (token, user) => {
    localStorage.setItem('agora_token', token);
    localStorage.setItem('agora_user', JSON.stringify(user));
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem('agora_token');
    localStorage.removeItem('agora_user');
    set({ token: null, user: null });
  },

  updateUser: (user) => {
    localStorage.setItem('agora_user', JSON.stringify(user));
    set({ user });
  },
}));

export default useAuthStore;
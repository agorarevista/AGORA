import { create } from 'zustand';

const getInitial = () => {
  try {
    const saved = localStorage.getItem('agora_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch { return 'light'; }
};

const apply = (theme) => {
  if (theme === 'dark') document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
  try { localStorage.setItem('agora_theme', theme); } catch {}
};

const useThemeStore = create((set) => ({
  theme: 'light',
  init: () => {
    const t = getInitial();
    apply(t);
    set({ theme: t });
  },
  toggle: () => set((s) => {
    const next = s.theme === 'light' ? 'dark' : 'light';
    apply(next);
    return { theme: next };
  }),
}));

export default useThemeStore;
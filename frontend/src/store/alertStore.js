import { create } from 'zustand';

const useAlertStore = create((set) => ({
  alert: null,

  showAlert: ({ type = 'info', title, message, duration = 4000 }) => {
    const id = Date.now();
    set({ alert: { id, type, title, message } });
    if (duration > 0) {
      setTimeout(() => set((state) => state.alert?.id === id ? { alert: null } : state), duration);
    }
  },

  hideAlert: () => set({ alert: null }),
}));

export default useAlertStore;
import { create } from 'zustand';

const useConfirmStore = create((set) => ({
  confirm: null,

  showConfirm: ({ title, message, type = 'warning', confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm, onCancel }) => {
    set({ confirm: { title, message, type, confirmLabel, cancelLabel, onConfirm, onCancel } });
  },

  hideConfirm: () => set({ confirm: null }),
}));

export default useConfirmStore;
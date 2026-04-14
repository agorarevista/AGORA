import { create } from 'zustand';

const useEditionStore = create((set) => ({
  currentEdition: null,
  setCurrentEdition: (edition) => set({ currentEdition: edition }),
}));

export default useEditionStore;
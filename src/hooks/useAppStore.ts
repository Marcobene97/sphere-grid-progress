import { create } from 'zustand';

interface AppStore {
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  
  draftTask: any | null;
  setDraftTask: (task: any | null) => void;
  
  runningSessionId: string | null;
  setRunningSessionId: (id: string | null) => void;
  
  isPaletteOpen: boolean;
  setIsPaletteOpen: (open: boolean) => void;
  
  isAddSheetOpen: boolean;
  setIsAddSheetOpen: (open: boolean) => void;
  
  isReviewModalOpen: boolean;
  setIsReviewModalOpen: (open: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  
  draftTask: null,
  setDraftTask: (task) => set({ draftTask: task }),
  
  runningSessionId: null,
  setRunningSessionId: (id) => set({ runningSessionId: id }),
  
  isPaletteOpen: false,
  setIsPaletteOpen: (open) => set({ isPaletteOpen: open }),
  
  isAddSheetOpen: false,
  setIsAddSheetOpen: (open) => set({ isAddSheetOpen: open }),
  
  isReviewModalOpen: false,
  setIsReviewModalOpen: (open) => set({ isReviewModalOpen: open }),
}));

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type XPState = { 
  xp: number; 
  setXP: (n: number) => void; 
  addXP: (n: number) => void; 
};

export const useXP = create<XPState>()(
  persist(
    (set) => ({ 
      xp: 0, 
      setXP: (n) => set({ xp: n }), 
      addXP: (n) => set(s => ({ xp: s.xp + n })) 
    }),
    { 
      name: 'sgp_xp_v1', 
      storage: createJSONStorage(() => localStorage) 
    }
  )
);
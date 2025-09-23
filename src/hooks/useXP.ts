import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { loadTotalXP } from '@/lib/xp';

type XPState = { 
  xp: number; 
  isLoading: boolean;
  setXP: (n: number) => void; 
  addXP: (n: number) => void; 
  loadXP: () => Promise<void>;
};

export const useXP = create<XPState>()(
  persist(
    (set, get) => ({ 
      xp: 0,
      isLoading: false,
      setXP: (n) => set({ xp: n }), 
      addXP: (n) => set(s => ({ xp: s.xp + n })),
      loadXP: async () => {
        try {
          set({ isLoading: true });
          const totalXP = await loadTotalXP();
          set({ xp: totalXP, isLoading: false });
        } catch (error) {
          console.error('Failed to load XP:', error);
          set({ isLoading: false });
        }
      }
    }),
    { 
      name: 'sgp_xp_v1', 
      storage: createJSONStorage(() => localStorage) 
    }
  )
);
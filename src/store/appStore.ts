import { create } from 'zustand';

import type { Language } from '@/constants/settings';

type AppState = {
  /** True once migrations, seeding and language setup have completed. */
  isReady: boolean;
  language: Language;
  hasActiveProgram: boolean;
  setReady: (state: { language: Language; hasActiveProgram: boolean }) => void;
  setLanguage: (language: Language) => void;
  setHasActiveProgram: (value: boolean) => void;
};

export const useAppStore = create<AppState>()((set) => ({
  isReady: false,
  language: 'en',
  hasActiveProgram: false,
  setReady: ({ language, hasActiveProgram }) => set({ isReady: true, language, hasActiveProgram }),
  setLanguage: (language) => set({ language }),
  setHasActiveProgram: (hasActiveProgram) => set({ hasActiveProgram }),
}));

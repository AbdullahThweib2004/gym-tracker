import { create } from 'zustand';

import type { Language } from '@/constants/settings';

type AppState = {
  /** True once migrations, seeding and language setup have completed. */
  isReady: boolean;
  language: Language;
  /** True when there is an active program and every one of its days has exercises. */
  isSetupComplete: boolean;
  setReady: (state: { language: Language; isSetupComplete: boolean }) => void;
  setLanguage: (language: Language) => void;
  setSetupComplete: (value: boolean) => void;
};

export const useAppStore = create<AppState>()((set) => ({
  isReady: false,
  language: 'en',
  isSetupComplete: false,
  setReady: ({ language, isSetupComplete }) => set({ isReady: true, language, isSetupComplete }),
  setLanguage: (language) => set({ language }),
  setSetupComplete: (isSetupComplete) => set({ isSetupComplete }),
}));

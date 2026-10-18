import { create } from 'zustand';

import type { ExerciseTargets } from '@/features/program/targets';

export type DraftEntry = ExerciseTargets & {
  exerciseId: number;
  restSeconds: number | null;
};

type ProgramDraftState = {
  /** Unsaved selections per program day id, kept while moving back and forth in the wizard. */
  drafts: Record<number, DraftEntry[]>;
  setDraft: (dayId: number, entries: DraftEntry[]) => void;
  clearDraft: (dayId: number) => void;
  clearAll: () => void;
};

export const useProgramDraftStore = create<ProgramDraftState>()((set) => ({
  drafts: {},
  setDraft: (dayId, entries) => set((state) => ({ drafts: { ...state.drafts, [dayId]: entries } })),
  clearDraft: (dayId) =>
    set((state) => {
      const { [dayId]: _removed, ...rest } = state.drafts;
      return { drafts: rest };
    }),
  clearAll: () => set({ drafts: {} }),
}));

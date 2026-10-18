import { create } from 'zustand';

import type { SetRow } from '@/features/workout/setRows';

const keyOf = (sessionId: number, exerciseId: number) => `${sessionId}:${exerciseId}`;

type WorkoutDraftState = {
  /**
   * Rows of the logging screen per session + exercise, so suggestions and unconfirmed edits
   * survive navigating between exercises. Confirmed sets live in the database, not here.
   */
  rows: Record<string, SetRow[]>;
  getRows: (sessionId: number, exerciseId: number) => SetRow[] | undefined;
  setRows: (sessionId: number, exerciseId: number, rows: SetRow[]) => void;
  clearSession: (sessionId: number) => void;
};

export const useWorkoutDraftStore = create<WorkoutDraftState>()((set, get) => ({
  rows: {},
  getRows: (sessionId, exerciseId) => get().rows[keyOf(sessionId, exerciseId)],
  setRows: (sessionId, exerciseId, rows) =>
    set((state) => ({ rows: { ...state.rows, [keyOf(sessionId, exerciseId)]: rows } })),
  clearSession: (sessionId) =>
    set((state) => ({
      rows: Object.fromEntries(
        Object.entries(state.rows).filter(([key]) => !key.startsWith(`${sessionId}:`)),
      ),
    })),
}));

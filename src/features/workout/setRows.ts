import { prefillFor, type SetValues } from './prefill';

/**
 * - `suggested`: pre-filled from last time (or copied), shown muted, not saved.
 * - `edited`: changed by the user, not saved yet.
 * - `saved`: stored in the database.
 */
export type SetRowState = 'suggested' | 'edited' | 'saved';

export type SetRow = {
  key: string;
  setId: number | null;
  weightKg: number | null;
  reps: number | null;
  isWarmup: boolean;
  state: SetRowState;
};

export type SavedSet = {
  id: number;
  setNumber: number;
  weightKg: number;
  reps: number;
  isWarmup: boolean;
};

let keySeed = 0;
export const newRowKey = () => `row-${Date.now().toString(36)}-${(keySeed++).toString(36)}`;

function suggestedRow(values: SetValues | null): SetRow {
  return {
    key: newRowKey(),
    setId: null,
    weightKg: values?.weightKg ?? null,
    reps: values?.reps ?? null,
    isWarmup: false,
    state: 'suggested',
  };
}

/**
 * Rows for the logging screen: sets already saved in this session first (so returning, or
 * reopening after a crash, restores them), then suggested rows until the target number of
 * working sets is reached.
 */
export function buildInitialRows(
  savedSets: readonly SavedSet[],
  lastWorkingSets: readonly SetValues[],
  targetSets: number,
): SetRow[] {
  const saved = [...savedSets]
    .sort((a, b) => a.setNumber - b.setNumber)
    .map((set): SetRow => ({
      key: `set-${set.id}`,
      setId: set.id,
      weightKg: set.weightKg,
      reps: set.reps,
      isWarmup: set.isWarmup,
      state: 'saved',
    }));
  const workingDone = saved.filter((row) => !row.isWarmup).length;
  const missing = Math.max(0, targetSets - workingDone);
  const suggested = Array.from({ length: missing }, (_, i) =>
    suggestedRow(prefillFor(lastWorkingSets, workingDone + i)),
  );
  return [...saved, ...suggested];
}

/** A new row copying the previous row's values (or last time's first set when there are no rows). */
export function appendRow(
  rows: readonly SetRow[],
  lastWorkingSets: readonly SetValues[],
): SetRow[] {
  const previous = rows[rows.length - 1];
  if (!previous) return [suggestedRow(prefillFor(lastWorkingSets, 0))];
  return [...rows, { ...suggestedRow(null), weightKg: previous.weightKg, reps: previous.reps }];
}

export type RowValidation =
  { ok: true; weightKg: number; reps: number } | { ok: false; weight: boolean; reps: boolean };

/** Weight must be ≥ 0 and reps a whole number ≥ 1. */
export function validateRow(row: Pick<SetRow, 'weightKg' | 'reps'>): RowValidation {
  const weightOk = row.weightKg !== null && Number.isFinite(row.weightKg) && row.weightKg >= 0;
  const repsOk = row.reps !== null && Number.isInteger(row.reps) && row.reps >= 1;
  if (weightOk && repsOk)
    return { ok: true, weightKg: row.weightKg as number, reps: row.reps as number };
  return { ok: false, weight: !weightOk, reps: !repsOk };
}

export function countWorkingSaved(rows: readonly SetRow[]): number {
  return rows.filter((row) => row.state === 'saved' && !row.isWarmup).length;
}

/** Display numbers counting working sets only (warm-ups get null), e.g. W, 1, 2, 3. */
export function workingOrdinals(rows: readonly { isWarmup: boolean }[]): (number | null)[] {
  let n = 0;
  return rows.map((row) => (row.isWarmup ? null : ++n));
}

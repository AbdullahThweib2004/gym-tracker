import { bestSet, type SetLike } from '@/utils/workoutStats';

import { estimate1RM } from './oneRepMax';

export { bestSet };

export type RecordKind = 'heaviestWeight' | 'best1RM' | 'mostRepsAtWeight';

type WorkingSet = { weightKg: number; reps: number };

/**
 * Which personal records `newSet` breaks compared with earlier working sets of the exercise.
 * - heaviestWeight: heavier than anything before.
 * - best1RM: higher estimated 1RM than anything before.
 * - mostRepsAtWeight: more reps than ever at this weight or heavier (only when that weight
 *   has been lifted before, otherwise it's just a weight PR).
 * Without history nothing counts as a record, so a first session isn't flooded with PRs.
 */
export function detectPRs(newSet: WorkingSet, history: readonly WorkingSet[]): RecordKind[] {
  if (history.length === 0 || newSet.reps < 1) return [];
  const records: RecordKind[] = [];

  const heaviest = Math.max(...history.map((s) => s.weightKg));
  if (newSet.weightKg > heaviest) records.push('heaviestWeight');

  const best1RM = Math.max(...history.map((s) => estimate1RM(s.weightKg, s.reps)));
  if (estimate1RM(newSet.weightKg, newSet.reps) > best1RM) records.push('best1RM');

  const atOrAbove = history.filter((s) => s.weightKg >= newSet.weightKg);
  if (atOrAbove.length > 0 && newSet.reps > Math.max(...atOrAbove.map((s) => s.reps))) {
    records.push('mostRepsAtWeight');
  }
  return records;
}

export type SessionRecord<T> = { set: T; records: RecordKind[] };

/**
 * PRs set during one session: each working set (in the order logged) is compared with all
 * earlier history plus the session's own earlier sets of the same exercise. Exercises with no
 * earlier history get no PRs (a first session would otherwise be all records).
 */
export function sessionRecords<T extends SetLike & { exerciseId: number }>(
  sessionSets: readonly T[],
  priorSets: readonly (SetLike & { exerciseId: number })[],
): SessionRecord<T>[] {
  const seen = new Map<number, WorkingSet[]>();
  for (const set of priorSets) {
    if (set.isWarmup) continue;
    const list = seen.get(set.exerciseId) ?? [];
    list.push(set);
    seen.set(set.exerciseId, list);
  }
  const hadHistory = new Set(seen.keys());
  const result: SessionRecord<T>[] = [];
  for (const set of sessionSets) {
    if (set.isWarmup) continue;
    const history = seen.get(set.exerciseId) ?? [];
    if (!hadHistory.has(set.exerciseId)) {
      seen.set(set.exerciseId, [...history, set]);
      continue;
    }
    const records = detectPRs(set, history);
    if (records.length > 0) result.push({ set, records });
    seen.set(set.exerciseId, [...history, set]);
  }
  return result;
}

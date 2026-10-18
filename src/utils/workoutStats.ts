export type SetLike = { weightKg: number; reps: number; isWarmup: boolean };

export function workingSets<T extends SetLike>(sets: readonly T[]): T[] {
  return sets.filter((set) => !set.isWarmup);
}

/** Total volume in kg: Σ weight × reps over working sets (warm-ups excluded). */
export function computeVolume(sets: readonly SetLike[]): number {
  const total = workingSets(sets).reduce((sum, set) => sum + set.weightKg * set.reps, 0);
  return Number.parseFloat(total.toFixed(2));
}

/** The heaviest working set; ties go to the one with more reps. Null without working sets. */
export function bestSet<T extends SetLike>(sets: readonly T[]): T | null {
  let best: T | null = null;
  for (const set of workingSets(sets)) {
    if (
      !best ||
      set.weightKg > best.weightKg ||
      (set.weightKg === best.weightKg && set.reps > best.reps)
    ) {
      best = set;
    }
  }
  return best;
}

/** Milliseconds between two ISO timestamps (0 when unfinished or out of order). */
export function sessionDurationMs(startedAt: string, finishedAt: string | null): number {
  if (!finishedAt) return 0;
  return Math.max(0, new Date(finishedAt).getTime() - new Date(startedAt).getTime());
}

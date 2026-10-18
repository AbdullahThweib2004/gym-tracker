export type SetValues = { weightKg: number; reps: number };

/**
 * Suggestion for the working set at `index` (0-based): last time's set with the same number,
 * or last time's final set when there were fewer sets. Null when there is no history.
 */
export function prefillFor(lastSets: readonly SetValues[], index: number): SetValues | null {
  const source = lastSets[index] ?? lastSets[lastSets.length - 1];
  return source ? { weightKg: source.weightKg, reps: source.reps } : null;
}

/** Suggestions for `targetSets` working sets, from last time's working sets (in set order). */
export function buildPrefill(
  lastSets: readonly SetValues[],
  targetSets: number,
): (SetValues | null)[] {
  return Array.from({ length: Math.max(0, targetSets) }, (_, index) => prefillFor(lastSets, index));
}

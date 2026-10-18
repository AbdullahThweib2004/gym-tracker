import {
  DEFAULT_TARGET_REPS_MAX,
  DEFAULT_TARGET_REPS_MIN,
  DEFAULT_TARGET_SETS,
  TARGET_REPS_MAX,
  TARGET_REPS_MIN,
  TARGET_SETS_MAX,
  TARGET_SETS_MIN,
} from '@/constants/settings';
import { clamp } from '@/utils/number';

export type ExerciseTargets = {
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
};

export const DEFAULT_TARGETS: ExerciseTargets = {
  targetSets: DEFAULT_TARGET_SETS,
  targetRepsMin: DEFAULT_TARGET_REPS_MIN,
  targetRepsMax: DEFAULT_TARGET_REPS_MAX,
};

/**
 * Clamps targets into their allowed ranges and keeps min ≤ max. When the two conflict,
 * the field the user just edited wins and the other one follows it.
 */
export function normalizeTargets(
  targets: ExerciseTargets,
  edited: 'min' | 'max' = 'min',
): ExerciseTargets {
  const targetSets = clamp(Math.round(targets.targetSets), TARGET_SETS_MIN, TARGET_SETS_MAX);
  let min = clamp(Math.round(targets.targetRepsMin), TARGET_REPS_MIN, TARGET_REPS_MAX);
  let max = clamp(Math.round(targets.targetRepsMax), TARGET_REPS_MIN, TARGET_REPS_MAX);
  if (min > max) {
    if (edited === 'min') max = min;
    else min = max;
  }
  return { targetSets, targetRepsMin: min, targetRepsMax: max };
}

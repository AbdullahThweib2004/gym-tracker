import type { Equipment, MuscleGroup } from '@/constants/muscles';

export type OverloadReason = 'increase' | 'buildReps' | 'moreReps';

export type OverloadSuggestion = {
  weightKg: number;
  reasonKey: OverloadReason;
  /** How much was added (0 unless increasing). */
  incrementKg: number;
};

const LOWER_BODY: readonly MuscleGroup[] = ['legs', 'glutes'];
const SMALL_MUSCLES: readonly MuscleGroup[] = [
  'biceps',
  'triceps',
  'shoulders',
  'forearms',
  'calves',
];

/** Weight jump when progressing: big lower-body lifts move faster, small dumbbell lifts slower. */
export function overloadIncrement(exercise: {
  muscleGroup: MuscleGroup;
  equipment: Equipment;
}): number {
  if (
    LOWER_BODY.includes(exercise.muscleGroup) &&
    (exercise.equipment === 'barbell' || exercise.equipment === 'machine')
  ) {
    return 5;
  }
  if (exercise.equipment === 'dumbbell' && SMALL_MUSCLES.includes(exercise.muscleGroup)) return 1;
  return 2.5;
}

/**
 * Double progression from last time's working sets:
 * - every set reached the top of the rep range → add weight;
 * - any set fell below the bottom of the range → same weight, build reps first;
 * - otherwise → same weight, aim for more reps.
 * Uses the heaviest working weight from last time. Null without history.
 */
export function suggestNextWeight(
  lastSets: readonly { weightKg: number; reps: number }[],
  target: { targetRepsMin: number; targetRepsMax: number },
  exercise: { muscleGroup: MuscleGroup; equipment: Equipment },
): OverloadSuggestion | null {
  if (lastSets.length === 0) return null;
  const weightKg = Math.max(...lastSets.map((s) => s.weightKg));
  if (lastSets.every((s) => s.reps >= target.targetRepsMax)) {
    const incrementKg = overloadIncrement(exercise);
    return {
      weightKg: Number.parseFloat((weightKg + incrementKg).toFixed(2)),
      reasonKey: 'increase',
      incrementKg,
    };
  }
  if (lastSets.some((s) => s.reps < target.targetRepsMin)) {
    return { weightKg, reasonKey: 'buildReps', incrementKg: 0 };
  }
  return { weightKg, reasonKey: 'moreReps', incrementKg: 0 };
}

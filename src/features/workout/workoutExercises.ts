import { DEFAULT_TARGETS, type ExerciseTargets } from '@/features/program/targets';

type SetRef = { exerciseId: number; isWarmup: boolean };

export type WorkoutExerciseSource = 'program' | 'extra' | 'logged';

export type WorkoutExerciseItem = ExerciseTargets & {
  exerciseId: number;
  source: WorkoutExerciseSource;
  /** Logged sets (any kind) and logged working sets for this exercise in the session. */
  loggedSets: number;
  workingSets: number;
  isComplete: boolean;
};

/**
 * The session's exercise list: the program day's exercises in order, then exercises added to
 * this session, then anything that has sets logged but is in neither (e.g. removed from the
 * program after the session started), so no logged data is ever hidden.
 */
export function buildWorkoutExercises(
  dayEntries: readonly (ExerciseTargets & { exerciseId: number })[],
  extraExerciseIds: readonly number[],
  sets: readonly SetRef[],
): WorkoutExerciseItem[] {
  const seen = new Set<number>();
  const ordered: { exerciseId: number; targets: ExerciseTargets; source: WorkoutExerciseSource }[] =
    [];
  const push = (exerciseId: number, targets: ExerciseTargets, source: WorkoutExerciseSource) => {
    if (seen.has(exerciseId)) return;
    seen.add(exerciseId);
    ordered.push({ exerciseId, targets, source });
  };

  for (const entry of dayEntries) {
    push(
      entry.exerciseId,
      {
        targetSets: entry.targetSets,
        targetRepsMin: entry.targetRepsMin,
        targetRepsMax: entry.targetRepsMax,
      },
      'program',
    );
  }
  for (const id of extraExerciseIds) push(id, DEFAULT_TARGETS, 'extra');
  for (const set of sets) push(set.exerciseId, DEFAULT_TARGETS, 'logged');

  return ordered.map(({ exerciseId, targets, source }) => {
    const mine = sets.filter((set) => set.exerciseId === exerciseId);
    const working = mine.filter((set) => !set.isWarmup).length;
    return {
      exerciseId,
      source,
      ...targets,
      loggedSets: mine.length,
      workingSets: working,
      isComplete: working >= targets.targetSets,
    };
  });
}

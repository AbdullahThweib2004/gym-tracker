import { META_KEYS, setMeta } from '@/db/repositories/appMeta';
import { listExercises } from '@/db/repositories/exercises';
import { listDayExercises } from '@/db/repositories/programDayExercises';
import { listProgramDays } from '@/db/repositories/programDays';
import { deleteProgram, getActiveProgram, listPrograms } from '@/db/repositories/userPrograms';
import { deleteAllSessions, insertFinishedSessions } from '@/db/repositories/workoutSessions';
import { chooseSplit, saveDayEntries } from '@/features/program/programService';
import { DEFAULT_TARGETS } from '@/features/program/targets';

import { buildDemoHistory, type DemoDay } from './demoHistory';

/** Seed for the dev demo data. */
const DEMO_SEED = 20261018;

/** Dev only: 8 weeks of finished sessions for the active program. Returns how many were added. */
export function generateDemoHistory(): number {
  const program = getActiveProgram();
  if (!program) return 0;
  const days: DemoDay[] = listProgramDays(program.id).map((day) => ({
    programDayId: day.id,
    dayKey: day.dayKey,
    exercises: listDayExercises(day.id).map((row) => ({
      exerciseId: row.exerciseId,
      muscleGroup: row.exercise.muscleGroup,
      equipment: row.exercise.equipment,
      targetSets: row.targetSets,
      targetRepsMin: row.targetRepsMin,
      targetRepsMax: row.targetRepsMax,
    })),
  }));
  const sessions = buildDemoHistory(days, { weeks: 8, seed: DEMO_SEED });
  return insertFinishedSessions(
    sessions.map((session) => ({ ...session, userProgramId: program.id })),
  );
}

/** Dev only: removes all workout sessions and their sets. Programs are kept. */
export function clearWorkoutHistory(): void {
  deleteAllSessions();
}

/** Built-in exercise keys for the demo Push / Pull / Legs program, in day order. */
const DEMO_PPL: readonly (readonly string[])[] = [
  [
    'barbell-bench-press',
    'incline-dumbbell-press',
    'seated-dumbbell-shoulder-press',
    'dumbbell-lateral-raise',
    'rope-pushdown',
  ],
  ['lat-pulldown', 'barbell-row', 'seated-cable-row', 'face-pull', 'dumbbell-curl'],
  ['back-squat', 'romanian-deadlift', 'leg-press', 'lying-leg-curl', 'standing-calf-raise-machine'],
];

/**
 * Dev only: replaces all programs and history with a Push / Pull / Legs program and 8 weeks of
 * demo history, for screenshots and demo recordings. Returns how many sessions were added.
 */
export function loadDemoProgram(): number {
  deleteAllSessions();
  listPrograms().forEach((program) => deleteProgram(program.id));
  const { program } = chooseSplit('ppl');
  const idByKey = new Map(listExercises().map((exercise) => [exercise.key, exercise.id]));
  listProgramDays(program.id).forEach((day, i) =>
    saveDayEntries(
      day.id,
      (DEMO_PPL[i] ?? []).flatMap((key) => {
        const exerciseId = idByKey.get(key);
        return exerciseId === undefined
          ? []
          : [{ ...DEFAULT_TARGETS, exerciseId, restSeconds: null }];
      }),
    ),
  );
  setMeta(META_KEYS.backupReminderDismissedAt, new Date().toISOString());
  return generateDemoHistory();
}

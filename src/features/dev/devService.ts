import { listDayExercises } from '@/db/repositories/programDayExercises';
import { listProgramDays } from '@/db/repositories/programDays';
import { getActiveProgram } from '@/db/repositories/userPrograms';
import { deleteAllSessions, insertFinishedSessions } from '@/db/repositories/workoutSessions';

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

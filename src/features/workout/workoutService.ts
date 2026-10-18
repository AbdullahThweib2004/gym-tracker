import { listDayExercises } from '@/db/repositories/programDayExercises';
import { getProgramById } from '@/db/repositories/userPrograms';
import {
  deleteSession,
  finishSession,
  getSessionById,
  startSession,
} from '@/db/repositories/workoutSessions';
import type { Exercise, ProgramDay, UserProgram, WorkoutSession } from '@/db/schema';

export type WorkoutData = {
  session: WorkoutSession;
  splitType: string | null;
  exercises: Exercise[];
};

export function loadWorkout(sessionId: number): WorkoutData | null {
  if (!Number.isFinite(sessionId)) return null;
  const session = getSessionById(sessionId);
  if (!session) return null;
  const splitType =
    session.userProgramId === null
      ? null
      : (getProgramById(session.userProgramId)?.splitType ?? null);
  const exercises =
    session.programDayId === null
      ? []
      : listDayExercises(session.programDayId).map((r) => r.exercise);
  return { session, splitType, exercises };
}

/** Creates a session for today, started now. */
export function startWorkout(program: UserProgram, day: ProgramDay): WorkoutSession {
  return startSession({ userProgramId: program.id, programDayId: day.id, dayKey: day.dayKey });
}

export function finishWorkout(sessionId: number): void {
  finishSession(sessionId);
}

/** Deletes the session and (by cascade) its logged sets. */
export function discardWorkout(sessionId: number): void {
  deleteSession(sessionId);
}

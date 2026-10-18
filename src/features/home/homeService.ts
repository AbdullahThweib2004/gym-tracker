import { listDayExercises } from '@/db/repositories/programDayExercises';
import { listProgramDays } from '@/db/repositories/programDays';
import { getActiveProgram, getProgramById } from '@/db/repositories/userPrograms';
import {
  getLastFinishedSession,
  getLastSessionForDay,
  getUnfinishedSession,
} from '@/db/repositories/workoutSessions';
import type { Exercise, ProgramDay, UserProgram, WorkoutSession } from '@/db/schema';

import { suggestNextDayId } from './nextDay';

export const PREVIEW_EXERCISE_COUNT = 3;

export type HomeDay = {
  day: ProgramDay;
  exerciseCount: number;
  previewExercises: Exercise[];
  /** YYYY-MM-DD of the last finished session for this day, if any. */
  lastDoneDate: string | null;
};

export type UnfinishedWorkout = {
  session: WorkoutSession;
  /** Split of the program the session belongs to, used to label its day. */
  splitType: string | null;
};

export type HomeData = {
  program: UserProgram;
  days: HomeDay[];
  suggestedDayId: number | null;
  unfinished: UnfinishedWorkout | null;
};

export function loadHomeData(): HomeData | null {
  const program = getActiveProgram();
  if (!program) return null;

  const days = listProgramDays(program.id).map((day): HomeDay => {
    const exercises = listDayExercises(day.id);
    return {
      day,
      exerciseCount: exercises.length,
      previewExercises: exercises.slice(0, PREVIEW_EXERCISE_COUNT).map((row) => row.exercise),
      lastDoneDate: getLastSessionForDay(day.id)?.date ?? null,
    };
  });

  const lastFinished = getLastFinishedSession();
  const unfinishedSession = getUnfinishedSession();
  const unfinished = unfinishedSession
    ? {
        session: unfinishedSession,
        splitType:
          unfinishedSession.userProgramId === null
            ? null
            : (getProgramById(unfinishedSession.userProgramId)?.splitType ?? null),
      }
    : null;

  return {
    program,
    days,
    suggestedDayId: suggestNextDayId(
      days.map((d) => d.day),
      lastFinished?.programDayId,
    ),
    unfinished,
  };
}

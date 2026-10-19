import { getMeta, META_KEYS, setMeta } from '@/db/repositories/appMeta';
import { listDayExercises } from '@/db/repositories/programDayExercises';
import { listProgramDays } from '@/db/repositories/programDays';
import { getActiveProgram, getProgramById } from '@/db/repositories/userPrograms';
import {
  countFinishedSessions,
  getLastSessionForDay,
  getUnfinishedSession,
  listFinishedSessionDatesSince,
} from '@/db/repositories/workoutSessions';
import type { Exercise, ProgramDay, UserProgram, WorkoutSession } from '@/db/schema';

import { shouldShowBackupReminder } from '@/features/backup/backupReminder';

import { startOfWeek, type WeekStart } from '@/features/history/weekGroups';
import { toIsoDate } from '@/utils/date';

import { weekActivity, type WeekDayActivity } from './weekActivity';

const PREVIEW_EXERCISE_COUNT = 6;

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
  unfinished: UnfinishedWorkout | null;
  showBackupReminder: boolean;
  /** This week's days with whether a workout was finished on each. */
  week: WeekDayActivity[];
};

export function loadHomeData(weekStartsOn: WeekStart = 1): HomeData | null {
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
    unfinished,
    week: weekActivity(
      listFinishedSessionDatesSince(toIsoDate(startOfWeek(new Date(), weekStartsOn))),
      new Date(),
      weekStartsOn,
    ),
    showBackupReminder: shouldShowBackupReminder({
      lastBackupAt: getMeta(META_KEYS.lastBackupAt),
      dismissedAt: getMeta(META_KEYS.backupReminderDismissedAt),
      finishedSessions: countFinishedSessions(),
      now: new Date(),
    }),
  };
}

/** Hides the backup reminder for the next 14 days. */
export function dismissBackupReminder(): void {
  setMeta(META_KEYS.backupReminderDismissedAt, new Date().toISOString());
}

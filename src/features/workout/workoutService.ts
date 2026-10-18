import { getExercisesByIds } from '@/db/repositories/exercises';
import { listDayExercises } from '@/db/repositories/programDayExercises';
import { addExtraExercises, listExtraExerciseIds } from '@/db/repositories/sessionExtraExercises';
import { deleteDraft, deleteSessionDrafts, getDraft, saveDraft } from '@/db/repositories/setDrafts';
import {
  deleteSet,
  getLastPerformance,
  listSetsForSessionExercise,
  setSetNumbers,
  updateSet,
  upsertSet,
  type LastPerformance,
  type UpsertSetInput,
} from '@/db/repositories/sessionSets';
import { getProgramById } from '@/db/repositories/userPrograms';
import {
  deleteSession,
  finishSession,
  getSessionById,
  getSessionWithSets,
  startSession,
} from '@/db/repositories/workoutSessions';
import type { Exercise, ProgramDay, SessionSet, UserProgram, WorkoutSession } from '@/db/schema';
import { getSplitDay } from '@/constants/splits';
import type { MuscleGroup } from '@/constants/muscles';

import { parseDraftRows } from './draftSchema';
import { hasPendingEdits, type SetRow } from './setRows';
import { buildWorkoutExercises, type WorkoutExerciseItem } from './workoutExercises';

export type WorkoutItem = WorkoutExerciseItem & { exercise: Exercise };

export type WorkoutData = {
  session: WorkoutSession;
  /** Split of the session's program, used to label its day. */
  splitType: string | null;
  items: WorkoutItem[];
  suggestedMuscleGroups: readonly MuscleGroup[];
};

function splitTypeOf(session: WorkoutSession): string | null {
  return session.userProgramId === null
    ? null
    : (getProgramById(session.userProgramId)?.splitType ?? null);
}

export function loadWorkout(sessionId: number): WorkoutData | null {
  if (!Number.isFinite(sessionId)) return null;
  const data = getSessionWithSets(sessionId);
  if (!data) return null;
  const { session, sets } = data;

  const dayEntries = session.programDayId === null ? [] : listDayExercises(session.programDayId);
  const built = buildWorkoutExercises(dayEntries, listExtraExerciseIds(session.id), sets);
  const byId = new Map<number, Exercise>(dayEntries.map((row) => [row.exercise.id, row.exercise]));
  const missing = built.map((item) => item.exerciseId).filter((id) => !byId.has(id));
  for (const exercise of getExercisesByIds(missing)) byId.set(exercise.id, exercise);

  const splitType = splitTypeOf(session);
  return {
    session,
    splitType,
    items: built.flatMap((item) => {
      const exercise = byId.get(item.exerciseId);
      return exercise ? [{ ...item, exercise }] : [];
    }),
    suggestedMuscleGroups: splitType
      ? (getSplitDay(splitType, session.dayKey)?.suggestedMuscleGroups ?? [])
      : [],
  };
}

export type ExerciseLogData = {
  session: WorkoutSession;
  item: WorkoutItem;
  savedSets: SessionSet[];
  last: LastPerformance | null;
  /** The following exercise in the session, for "Next exercise". */
  nextExerciseId: number | null;
};

export function loadExerciseLog(sessionId: number, exerciseId: number): ExerciseLogData | null {
  const workout = loadWorkout(sessionId);
  if (!workout) return null;
  const index = workout.items.findIndex((item) => item.exerciseId === exerciseId);
  const item = workout.items[index];
  if (!item) return null;
  return {
    session: workout.session,
    item,
    savedSets: listSetsForSessionExercise(sessionId, exerciseId),
    last: getLastPerformance(exerciseId, sessionId),
    nextExerciseId: workout.items[index + 1]?.exerciseId ?? null,
  };
}

/** Saves one set immediately (insert or update). */
export function saveSet(input: UpsertSetInput): SessionSet {
  return upsertSet(input);
}

export function setWarmup(setId: number, isWarmup: boolean): void {
  updateSet(setId, { isWarmup });
}

/**
 * Deletes a set, then gives the remaining saved sets the numbers of their on-screen positions
 * (unsaved rows keep their slots, so a later confirm can't reuse a taken number).
 */
export function removeSet(
  setId: number,
  renumber: readonly { id: number; setNumber: number }[],
): void {
  deleteSet(setId);
  setSetNumbers(renumber);
}

export function addExercisesToSession(sessionId: number, exerciseIds: readonly number[]): void {
  addExtraExercises(sessionId, exerciseIds);
}

/** Exercises in the session that have no sets logged at all. */
export function countUnloggedExercises(sessionId: number): number {
  return loadWorkout(sessionId)?.items.filter((item) => item.loggedSets === 0).length ?? 0;
}

/** Creates a session for today, started now. */
export function startWorkout(program: UserProgram, day: ProgramDay): WorkoutSession {
  return startSession({ userProgramId: program.id, programDayId: day.id, dayKey: day.dayKey });
}

export function finishWorkout(sessionId: number): void {
  const session = getSessionById(sessionId);
  if (session && !session.finishedAt) finishSession(sessionId);
  deleteSessionDrafts(sessionId);
}

/** The persisted unconfirmed rows for an exercise, or null when there are none (or invalid). */
export function loadDraftRows(sessionId: number, exerciseId: number): SetRow[] | null {
  return parseDraftRows(getDraft(sessionId, exerciseId));
}

/**
 * Persists the rows while they hold unconfirmed edits, so a killed app restores them.
 * Once nothing is pending (all confirmed or just suggestions) the draft is removed.
 */
export function persistDraftRows(
  sessionId: number,
  exerciseId: number,
  rows: readonly SetRow[],
): void {
  if (hasPendingEdits(rows)) saveDraft(sessionId, exerciseId, rows);
  else deleteDraft(sessionId, exerciseId);
}

/** Deletes the session and (by cascade) its logged sets and drafts. */
export function discardWorkout(sessionId: number): void {
  deleteSession(sessionId);
}

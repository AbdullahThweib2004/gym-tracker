import { and, asc, desc, eq, isNotNull, ne, sql } from 'drizzle-orm';

import { db, type DbExecutor } from '../client';
import { sessionSets, workoutSessions, type SessionSet, type WorkoutSession } from '../schema';

export type AddSetInput = {
  sessionId: number;
  exerciseId: number;
  weightKg: number;
  reps: number;
  isWarmup?: boolean;
  /** Defaults to the next number for this exercise in the session. */
  setNumber?: number;
};

export function listSetsForSession(sessionId: number, executor: DbExecutor = db): SessionSet[] {
  return executor
    .select()
    .from(sessionSets)
    .where(eq(sessionSets.sessionId, sessionId))
    .orderBy(asc(sessionSets.createdAt), asc(sessionSets.id))
    .all();
}

export function listSetsForSessionExercise(
  sessionId: number,
  exerciseId: number,
  executor: DbExecutor = db,
): SessionSet[] {
  return executor
    .select()
    .from(sessionSets)
    .where(and(eq(sessionSets.sessionId, sessionId), eq(sessionSets.exerciseId, exerciseId)))
    .orderBy(asc(sessionSets.setNumber))
    .all();
}

export function addSet(input: AddSetInput, executor: DbExecutor = db): SessionSet {
  const setNumber =
    input.setNumber ??
    (executor
      .select({ maxSet: sql<number | null>`max(${sessionSets.setNumber})` })
      .from(sessionSets)
      .where(
        and(
          eq(sessionSets.sessionId, input.sessionId),
          eq(sessionSets.exerciseId, input.exerciseId),
        ),
      )
      .get()?.maxSet ?? 0) + 1;

  return executor
    .insert(sessionSets)
    .values({
      sessionId: input.sessionId,
      exerciseId: input.exerciseId,
      setNumber,
      weightKg: input.weightKg,
      reps: Math.round(input.reps),
      isWarmup: input.isWarmup ?? false,
      createdAt: new Date().toISOString(),
    })
    .returning()
    .get();
}

export function updateSet(
  id: number,
  patch: Partial<Pick<SessionSet, 'weightKg' | 'reps' | 'isWarmup'>>,
  executor: DbExecutor = db,
): void {
  const values = patch.reps === undefined ? patch : { ...patch, reps: Math.round(patch.reps) };
  executor.update(sessionSets).set(values).where(eq(sessionSets.id, id)).run();
}

/** Deletes a set and renumbers the remaining sets of that exercise in the session. */
export function deleteSet(id: number): void {
  db.transaction((tx) => {
    const set = tx.select().from(sessionSets).where(eq(sessionSets.id, id)).get();
    if (!set) return;
    tx.delete(sessionSets).where(eq(sessionSets.id, id)).run();
    const remaining = listSetsForSessionExercise(set.sessionId, set.exerciseId, tx);
    remaining.forEach((row, index) => {
      if (row.setNumber !== index + 1) {
        tx.update(sessionSets)
          .set({ setNumber: index + 1 })
          .where(eq(sessionSets.id, row.id))
          .run();
      }
    });
  });
}

export type PreviousPerformance = {
  session: WorkoutSession;
  sets: SessionSet[];
};

/**
 * The sets logged for an exercise in the most recent *finished* session that included it.
 * This powers the "last time" panel and the input pre-fill.
 */
export function getPreviousPerformance(
  exerciseId: number,
  { excludeSessionId }: { excludeSessionId?: number } = {},
  executor: DbExecutor = db,
): PreviousPerformance | null {
  const conditions = [
    eq(sessionSets.exerciseId, exerciseId),
    isNotNull(workoutSessions.finishedAt),
  ];
  if (excludeSessionId !== undefined) conditions.push(ne(workoutSessions.id, excludeSessionId));

  const last = executor
    .select({ session: workoutSessions })
    .from(sessionSets)
    .innerJoin(workoutSessions, eq(sessionSets.sessionId, workoutSessions.id))
    .where(and(...conditions))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(1)
    .get();
  if (!last) return null;

  return {
    session: last.session,
    sets: listSetsForSessionExercise(last.session.id, exerciseId, executor),
  };
}

export type ExerciseHistoryEntry = SessionSet & { date: string; sessionStartedAt: string };

/** All working and warm-up sets for an exercise from finished sessions, newest first. */
export function listExerciseHistory(
  exerciseId: number,
  { limit = 200 }: { limit?: number } = {},
  executor: DbExecutor = db,
): ExerciseHistoryEntry[] {
  const rows = executor
    .select({
      set: sessionSets,
      date: workoutSessions.date,
      sessionStartedAt: workoutSessions.startedAt,
    })
    .from(sessionSets)
    .innerJoin(workoutSessions, eq(sessionSets.sessionId, workoutSessions.id))
    .where(and(eq(sessionSets.exerciseId, exerciseId), isNotNull(workoutSessions.finishedAt)))
    .orderBy(desc(workoutSessions.startedAt), asc(sessionSets.setNumber))
    .limit(limit)
    .all();
  return rows.map(({ set, date, sessionStartedAt }) => ({ ...set, date, sessionStartedAt }));
}

export function countSetsForSession(sessionId: number, executor: DbExecutor = db): number {
  const row = executor
    .select({ count: sql<number>`count(*)` })
    .from(sessionSets)
    .where(eq(sessionSets.sessionId, sessionId))
    .get();
  return row?.count ?? 0;
}

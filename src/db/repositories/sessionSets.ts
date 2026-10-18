import { and, asc, desc, eq, inArray, isNotNull, lt, ne, sql } from 'drizzle-orm';

import { db, type DbExecutor } from '../client';
import { sessionSets, workoutSessions, type SessionSet } from '../schema';

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

export type LastPerformance = {
  sessionId: number;
  /** YYYY-MM-DD of that session. */
  date: string;
  /** Working sets only, ordered by set number. */
  sets: SessionSet[];
};

/**
 * Working sets (warm-ups excluded) of an exercise from the most recent *finished* session in
 * which it had a working set, plus that session's date. Powers "Last time" and the pre-fill.
 */
export function getLastPerformance(
  exerciseId: number,
  excludeSessionId?: number,
  executor: DbExecutor = db,
): LastPerformance | null {
  const conditions = [
    eq(sessionSets.exerciseId, exerciseId),
    eq(sessionSets.isWarmup, false),
    isNotNull(workoutSessions.finishedAt),
  ];
  if (excludeSessionId !== undefined) conditions.push(ne(workoutSessions.id, excludeSessionId));

  const last = executor
    .select({ id: workoutSessions.id, date: workoutSessions.date })
    .from(sessionSets)
    .innerJoin(workoutSessions, eq(sessionSets.sessionId, workoutSessions.id))
    .where(and(...conditions))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(1)
    .get();
  if (!last) return null;

  const sets = executor
    .select()
    .from(sessionSets)
    .where(
      and(
        eq(sessionSets.sessionId, last.id),
        eq(sessionSets.exerciseId, exerciseId),
        eq(sessionSets.isWarmup, false),
      ),
    )
    .orderBy(asc(sessionSets.setNumber))
    .all();
  return { sessionId: last.id, date: last.date, sets };
}

export type UpsertSetInput = {
  /** Existing set to update; omit or null to insert. */
  id?: number | null;
  sessionId: number;
  exerciseId: number;
  setNumber: number;
  weightKg: number;
  reps: number;
  isWarmup: boolean;
};

/** Inserts or updates one set and returns the stored row. */
export function upsertSet(input: UpsertSetInput, executor: DbExecutor = db): SessionSet {
  const values = {
    setNumber: input.setNumber,
    weightKg: input.weightKg,
    reps: Math.round(input.reps),
    isWarmup: input.isWarmup,
  };
  if (input.id !== undefined && input.id !== null) {
    const updated = executor
      .update(sessionSets)
      .set(values)
      .where(eq(sessionSets.id, input.id))
      .returning()
      .get();
    if (updated) return updated;
  }
  return executor
    .insert(sessionSets)
    .values({
      ...values,
      sessionId: input.sessionId,
      exerciseId: input.exerciseId,
      createdAt: new Date().toISOString(),
    })
    .returning()
    .get();
}

/** Sets explicit set numbers (e.g. to match the order shown after a row was removed). */
export function setSetNumbers(updates: readonly { id: number; setNumber: number }[]): void {
  if (updates.length === 0) return;
  db.transaction((tx) => {
    for (const { id, setNumber } of updates) {
      tx.update(sessionSets).set({ setNumber }).where(eq(sessionSets.id, id)).run();
    }
  });
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

/** Every working set ever logged for an exercise, optionally minus one set. */
export function listWorkingSetValues(
  exerciseId: number,
  { excludeSetId }: { excludeSetId?: number } = {},
  executor: DbExecutor = db,
): { sessionId: number; weightKg: number; reps: number }[] {
  const conditions = [eq(sessionSets.exerciseId, exerciseId), eq(sessionSets.isWarmup, false)];
  if (excludeSetId !== undefined) conditions.push(ne(sessionSets.id, excludeSetId));
  return executor
    .select({
      sessionId: sessionSets.sessionId,
      weightKg: sessionSets.weightKg,
      reps: sessionSets.reps,
    })
    .from(sessionSets)
    .where(and(...conditions))
    .all();
}

/** Working sets of the given exercises from sessions that started before `beforeStartedAt`. */
export function listPriorWorkingSets(
  exerciseIds: readonly number[],
  beforeStartedAt: string,
  executor: DbExecutor = db,
): { exerciseId: number; weightKg: number; reps: number; isWarmup: boolean }[] {
  if (exerciseIds.length === 0) return [];
  return executor
    .select({
      exerciseId: sessionSets.exerciseId,
      weightKg: sessionSets.weightKg,
      reps: sessionSets.reps,
      isWarmup: sessionSets.isWarmup,
    })
    .from(sessionSets)
    .innerJoin(workoutSessions, eq(sessionSets.sessionId, workoutSessions.id))
    .where(
      and(
        inArray(sessionSets.exerciseId, [...exerciseIds]),
        eq(sessionSets.isWarmup, false),
        lt(workoutSessions.startedAt, beforeStartedAt),
      ),
    )
    .all();
}

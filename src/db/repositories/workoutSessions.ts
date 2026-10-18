import { and, between, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm';

import { toIsoDate } from '@/utils/date';

import { db, type DbExecutor } from '../client';
import { workoutSessions, type WorkoutSession } from '../schema';

export type StartSessionInput = {
  userProgramId: number | null;
  programDayId: number | null;
  dayKey: string;
  startedAt?: Date;
};

export function startSession(input: StartSessionInput, executor: DbExecutor = db): WorkoutSession {
  const startedAt = input.startedAt ?? new Date();
  return executor
    .insert(workoutSessions)
    .values({
      userProgramId: input.userProgramId,
      programDayId: input.programDayId,
      dayKey: input.dayKey,
      date: toIsoDate(startedAt),
      startedAt: startedAt.toISOString(),
    })
    .returning()
    .get();
}

export function getSessionById(id: number, executor: DbExecutor = db): WorkoutSession | undefined {
  return executor.select().from(workoutSessions).where(eq(workoutSessions.id, id)).get();
}

/** The most recent session that was started but never finished, if any. */
export function getUnfinishedSession(executor: DbExecutor = db): WorkoutSession | undefined {
  return executor
    .select()
    .from(workoutSessions)
    .where(isNull(workoutSessions.finishedAt))
    .orderBy(desc(workoutSessions.startedAt))
    .get();
}

export function finishSession(
  id: number,
  finishedAt: Date = new Date(),
  executor: DbExecutor = db,
): void {
  executor
    .update(workoutSessions)
    .set({ finishedAt: finishedAt.toISOString() })
    .where(eq(workoutSessions.id, id))
    .run();
}

export function updateSessionNotes(
  id: number,
  notes: string | null,
  executor: DbExecutor = db,
): void {
  const value = notes?.trim() ? notes.trim() : null;
  executor.update(workoutSessions).set({ notes: value }).where(eq(workoutSessions.id, id)).run();
}

/** Deletes a session; its sets are removed by the cascade. */
export function deleteSession(id: number, executor: DbExecutor = db): void {
  executor.delete(workoutSessions).where(eq(workoutSessions.id, id)).run();
}

export function listFinishedSessions(
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {},
  executor: DbExecutor = db,
): WorkoutSession[] {
  return executor
    .select()
    .from(workoutSessions)
    .where(isNotNull(workoutSessions.finishedAt))
    .orderBy(desc(workoutSessions.finishedAt))
    .limit(limit)
    .offset(offset)
    .all();
}

/** Finished sessions whose date (YYYY-MM-DD) is within [fromDate, toDate], newest first. */
export function listSessionsBetween(
  fromDate: string,
  toDate: string,
  executor: DbExecutor = db,
): WorkoutSession[] {
  return executor
    .select()
    .from(workoutSessions)
    .where(
      and(isNotNull(workoutSessions.finishedAt), between(workoutSessions.date, fromDate, toDate)),
    )
    .orderBy(desc(workoutSessions.date), desc(workoutSessions.startedAt))
    .all();
}

/** The most recent finished session of any day — used to suggest the next day in the split. */
export function getLastFinishedSession(executor: DbExecutor = db): WorkoutSession | undefined {
  return executor
    .select()
    .from(workoutSessions)
    .where(isNotNull(workoutSessions.finishedAt))
    .orderBy(desc(workoutSessions.finishedAt))
    .get();
}

export function getLastSessionForDay(
  programDayId: number,
  executor: DbExecutor = db,
): WorkoutSession | undefined {
  return executor
    .select()
    .from(workoutSessions)
    .where(
      and(eq(workoutSessions.programDayId, programDayId), isNotNull(workoutSessions.finishedAt)),
    )
    .orderBy(desc(workoutSessions.finishedAt))
    .get();
}

export function countFinishedSessions(executor: DbExecutor = db): number {
  const row = executor
    .select({ count: sql<number>`count(*)` })
    .from(workoutSessions)
    .where(isNotNull(workoutSessions.finishedAt))
    .get();
  return row?.count ?? 0;
}

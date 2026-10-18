import { and, eq } from 'drizzle-orm';

import { db, type DbExecutor } from '../client';
import { setDrafts } from '../schema';

/** The stored draft (parsed JSON) for one exercise in a session, or null. */
export function getDraft(
  sessionId: number,
  exerciseId: number,
  executor: DbExecutor = db,
): unknown {
  const row = executor
    .select({ rowsJson: setDrafts.rowsJson })
    .from(setDrafts)
    .where(and(eq(setDrafts.sessionId, sessionId), eq(setDrafts.exerciseId, exerciseId)))
    .get();
  if (!row) return null;
  try {
    return JSON.parse(row.rowsJson) as unknown;
  } catch {
    return null;
  }
}

export function saveDraft(
  sessionId: number,
  exerciseId: number,
  rows: unknown,
  executor: DbExecutor = db,
): void {
  const rowsJson = JSON.stringify(rows);
  const updatedAt = new Date().toISOString();
  executor
    .insert(setDrafts)
    .values({ sessionId, exerciseId, rowsJson, updatedAt })
    .onConflictDoUpdate({
      target: [setDrafts.sessionId, setDrafts.exerciseId],
      set: { rowsJson, updatedAt },
    })
    .run();
}

export function deleteDraft(
  sessionId: number,
  exerciseId: number,
  executor: DbExecutor = db,
): void {
  executor
    .delete(setDrafts)
    .where(and(eq(setDrafts.sessionId, sessionId), eq(setDrafts.exerciseId, exerciseId)))
    .run();
}

export function deleteSessionDrafts(sessionId: number, executor: DbExecutor = db): void {
  executor.delete(setDrafts).where(eq(setDrafts.sessionId, sessionId)).run();
}

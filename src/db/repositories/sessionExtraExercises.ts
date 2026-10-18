import { asc, eq, sql } from 'drizzle-orm';

import { db, type DbExecutor } from '../client';
import { sessionExtraExercises } from '../schema';

export function listExtraExerciseIds(sessionId: number, executor: DbExecutor = db): number[] {
  return executor
    .select({ exerciseId: sessionExtraExercises.exerciseId })
    .from(sessionExtraExercises)
    .where(eq(sessionExtraExercises.sessionId, sessionId))
    .orderBy(asc(sessionExtraExercises.orderIndex))
    .all()
    .map((row) => row.exerciseId);
}

/** Appends exercises to a session (not to its program). Already-added ones are ignored. */
export function addExtraExercises(sessionId: number, exerciseIds: readonly number[]): void {
  if (exerciseIds.length === 0) return;
  db.transaction((tx) => {
    const row = tx
      .select({ maxOrder: sql<number | null>`max(${sessionExtraExercises.orderIndex})` })
      .from(sessionExtraExercises)
      .where(eq(sessionExtraExercises.sessionId, sessionId))
      .get();
    let orderIndex = (row?.maxOrder ?? -1) + 1;
    for (const exerciseId of exerciseIds) {
      tx.insert(sessionExtraExercises)
        .values({ sessionId, exerciseId, orderIndex: orderIndex++ })
        .onConflictDoNothing()
        .run();
    }
  });
}

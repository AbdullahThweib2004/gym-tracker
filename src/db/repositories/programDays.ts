import { asc, eq } from 'drizzle-orm';

import { db, type DbExecutor } from '../client';
import { programDays, type ProgramDay } from '../schema';

export function listProgramDays(userProgramId: number, executor: DbExecutor = db): ProgramDay[] {
  return executor
    .select()
    .from(programDays)
    .where(eq(programDays.userProgramId, userProgramId))
    .orderBy(asc(programDays.orderIndex))
    .all();
}

export function getProgramDayById(id: number, executor: DbExecutor = db): ProgramDay | undefined {
  return executor.select().from(programDays).where(eq(programDays.id, id)).get();
}

export function createProgramDay(
  input: { userProgramId: number; dayKey: string; orderIndex: number },
  executor: DbExecutor = db,
): ProgramDay {
  return executor.insert(programDays).values(input).returning().get();
}

/** Inserts the days of a program in the given order. */
export function createProgramDays(
  userProgramId: number,
  dayKeys: readonly string[],
  executor: DbExecutor = db,
): ProgramDay[] {
  if (dayKeys.length === 0) return [];
  return executor
    .insert(programDays)
    .values(dayKeys.map((dayKey, orderIndex) => ({ userProgramId, dayKey, orderIndex })))
    .returning()
    .all();
}

export function reorderProgramDays(orderedIds: readonly number[]): void {
  db.transaction((tx) => {
    orderedIds.forEach((id, orderIndex) => {
      tx.update(programDays).set({ orderIndex }).where(eq(programDays.id, id)).run();
    });
  });
}

export function deleteProgramDay(id: number, executor: DbExecutor = db): void {
  executor.delete(programDays).where(eq(programDays.id, id)).run();
}

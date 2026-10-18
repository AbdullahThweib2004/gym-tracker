import { desc, eq } from 'drizzle-orm';

import type { SplitKey } from '@/constants/splits';

import { db, type DbExecutor } from '../client';
import { userPrograms, type ProgramDay, type UserProgram } from '../schema';

import { countExercisesPerDay } from './programDayExercises';
import { createProgramDays, listProgramDays } from './programDays';

export function getActiveProgram(executor: DbExecutor = db): UserProgram | undefined {
  return executor.select().from(userPrograms).where(eq(userPrograms.isActive, true)).get();
}

export function getProgramById(id: number, executor: DbExecutor = db): UserProgram | undefined {
  return executor.select().from(userPrograms).where(eq(userPrograms.id, id)).get();
}

export function listPrograms(executor: DbExecutor = db): UserProgram[] {
  return executor.select().from(userPrograms).orderBy(desc(userPrograms.createdAt)).all();
}

/** Creates a program. When `activate` is true it becomes the only active program. */
export function createProgram(
  splitType: SplitKey,
  { activate = true }: { activate?: boolean } = {},
  executor: DbExecutor = db,
): UserProgram {
  if (activate) executor.update(userPrograms).set({ isActive: false }).run();
  return executor
    .insert(userPrograms)
    .values({ splitType, isActive: activate, createdAt: new Date().toISOString() })
    .returning()
    .get();
}

/** Deletes a program and its days. Logged sessions are kept (their program link is nulled). */
export function deleteProgram(id: number, executor: DbExecutor = db): void {
  executor.delete(userPrograms).where(eq(userPrograms.id, id)).run();
}

/**
 * Creates a program for a split with all its days (in order) and makes it the only active
 * program, in a single transaction. Older programs and their history are kept, except
 * `deleteProgramId` (an abandoned, never-used setup) which is removed in the same transaction.
 */
export function createProgramWithDays(
  splitType: SplitKey,
  dayKeys: readonly string[],
  { deleteProgramId }: { deleteProgramId?: number } = {},
): { program: UserProgram; days: ProgramDay[] } {
  return db.transaction((tx) => {
    if (deleteProgramId !== undefined) deleteProgram(deleteProgramId, tx);
    const program = createProgram(splitType, { activate: true }, tx);
    const days = createProgramDays(program.id, dayKeys, tx);
    return { program, days };
  });
}

/** True when the program has at least one day and every day has at least one exercise. */
export function isProgramSetupComplete(programId: number, executor: DbExecutor = db): boolean {
  const days = listProgramDays(programId, executor);
  if (days.length === 0) return false;
  const counts = countExercisesPerDay(programId, executor);
  return days.every((day) => (counts.get(day.id) ?? 0) > 0);
}

/** True when there is an active program whose setup is complete. */
export function hasCompleteActiveProgram(executor: DbExecutor = db): boolean {
  const program = getActiveProgram(executor);
  return program ? isProgramSetupComplete(program.id, executor) : false;
}

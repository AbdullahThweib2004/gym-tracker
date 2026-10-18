import { desc, eq } from 'drizzle-orm';

import type { SplitKey } from '@/constants/splits';

import { db, type DbExecutor } from '../client';
import { programDays, userPrograms, type UserProgram } from '../schema';

export function getActiveProgram(executor: DbExecutor = db): UserProgram | undefined {
  return executor.select().from(userPrograms).where(eq(userPrograms.isActive, true)).get();
}

export function hasActiveProgram(executor: DbExecutor = db): boolean {
  return getActiveProgram(executor) !== undefined;
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

export function setActiveProgram(id: number): void {
  db.transaction((tx) => {
    tx.update(userPrograms).set({ isActive: false }).run();
    tx.update(userPrograms).set({ isActive: true }).where(eq(userPrograms.id, id)).run();
  });
}

export function deactivateAllPrograms(executor: DbExecutor = db): void {
  executor.update(userPrograms).set({ isActive: false }).run();
}

/** Deletes a program and its days. Logged sessions are kept (their program link is nulled). */
export function deleteProgram(id: number, executor: DbExecutor = db): void {
  executor.delete(userPrograms).where(eq(userPrograms.id, id)).run();
}

/**
 * Creates a program for a split with all its days and makes it the only active program,
 * in a single transaction.
 */
export function createProgramWithDays(
  splitType: SplitKey,
  dayKeys: readonly string[],
): UserProgram {
  return db.transaction((tx) => {
    const program = createProgram(splitType, { activate: true }, tx);
    if (dayKeys.length > 0) {
      tx.insert(programDays)
        .values(
          dayKeys.map((dayKey, orderIndex) => ({ userProgramId: program.id, dayKey, orderIndex })),
        )
        .run();
    }
    return program;
  });
}

import { asc, eq, sql } from 'drizzle-orm';

import { db, type DbExecutor } from '../client';
import {
  exercises,
  programDayExercises,
  type Exercise,
  type NewProgramDayExercise,
  type ProgramDayExercise,
} from '../schema';

export type ProgramDayExerciseWithExercise = ProgramDayExercise & { exercise: Exercise };

export function listDayExercises(
  programDayId: number,
  executor: DbExecutor = db,
): ProgramDayExerciseWithExercise[] {
  const rows = executor
    .select({ entry: programDayExercises, exercise: exercises })
    .from(programDayExercises)
    .innerJoin(exercises, eq(programDayExercises.exerciseId, exercises.id))
    .where(eq(programDayExercises.programDayId, programDayId))
    .orderBy(asc(programDayExercises.orderIndex))
    .all();
  return rows.map(({ entry, exercise }) => ({ ...entry, exercise }));
}

export function getDayExerciseById(
  id: number,
  executor: DbExecutor = db,
): ProgramDayExercise | undefined {
  return executor.select().from(programDayExercises).where(eq(programDayExercises.id, id)).get();
}

export type DayExerciseTargets = Partial<
  Pick<NewProgramDayExercise, 'targetSets' | 'targetRepsMin' | 'targetRepsMax' | 'restSeconds'>
>;

/** Appends an exercise to the end of a day. */
export function addDayExercise(
  programDayId: number,
  exerciseId: number,
  targets: DayExerciseTargets = {},
  executor: DbExecutor = db,
): ProgramDayExercise {
  const row = executor
    .select({ maxOrder: sql<number | null>`max(${programDayExercises.orderIndex})` })
    .from(programDayExercises)
    .where(eq(programDayExercises.programDayId, programDayId))
    .get();
  const orderIndex = (row?.maxOrder ?? -1) + 1;
  return executor
    .insert(programDayExercises)
    .values({ programDayId, exerciseId, orderIndex, ...targets })
    .returning()
    .get();
}

/** Replaces all exercises of a day with the given ordered list (used by the day editor). */
export function setDayExercises(
  programDayId: number,
  entries: readonly ({ exerciseId: number } & DayExerciseTargets)[],
  executor: DbExecutor = db,
): void {
  executor
    .delete(programDayExercises)
    .where(eq(programDayExercises.programDayId, programDayId))
    .run();
  if (entries.length === 0) return;
  executor
    .insert(programDayExercises)
    .values(entries.map((entry, orderIndex) => ({ ...entry, programDayId, orderIndex })))
    .run();
}

export function updateDayExerciseTargets(
  id: number,
  targets: DayExerciseTargets,
  executor: DbExecutor = db,
): void {
  executor.update(programDayExercises).set(targets).where(eq(programDayExercises.id, id)).run();
}

export function reorderDayExercises(orderedIds: readonly number[]): void {
  db.transaction((tx) => {
    orderedIds.forEach((id, orderIndex) => {
      tx.update(programDayExercises)
        .set({ orderIndex })
        .where(eq(programDayExercises.id, id))
        .run();
    });
  });
}

export function removeDayExercise(id: number, executor: DbExecutor = db): void {
  executor.delete(programDayExercises).where(eq(programDayExercises.id, id)).run();
}

import { and, asc, eq, inArray, like, or, sql, type SQL } from 'drizzle-orm';

import type { Equipment, MuscleGroup } from '@/constants/muscles';

import { db, type DbExecutor } from '../client';
import {
  exercises,
  programDayExercises,
  sessionSets,
  type Exercise,
  type NewExercise,
} from '../schema';

export type ExerciseFilter = {
  muscleGroups?: readonly MuscleGroup[];
  equipment?: readonly Equipment[];
  search?: string;
  includeArchived?: boolean;
};

export function listExercises(filter: ExerciseFilter = {}, executor: DbExecutor = db): Exercise[] {
  const conditions: SQL[] = [];
  if (!filter.includeArchived) conditions.push(eq(exercises.isArchived, false));
  if (filter.muscleGroups?.length)
    conditions.push(inArray(exercises.muscleGroup, [...filter.muscleGroups]));
  if (filter.equipment?.length)
    conditions.push(inArray(exercises.equipment, [...filter.equipment]));
  const search = filter.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    const match = or(like(exercises.nameEn, pattern), like(exercises.nameAr, pattern));
    if (match) conditions.push(match);
  }
  return executor
    .select()
    .from(exercises)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(exercises.muscleGroup), asc(exercises.nameEn))
    .all();
}

export function getExerciseById(id: number, executor: DbExecutor = db): Exercise | undefined {
  return executor.select().from(exercises).where(eq(exercises.id, id)).get();
}

export function getExercisesByIds(ids: readonly number[], executor: DbExecutor = db): Exercise[] {
  if (ids.length === 0) return [];
  return executor
    .select()
    .from(exercises)
    .where(inArray(exercises.id, [...ids]))
    .all();
}

export function countExercises(executor: DbExecutor = db): number {
  const row = executor
    .select({ count: sql<number>`count(*)` })
    .from(exercises)
    .get();
  return row?.count ?? 0;
}

export type CreateExerciseInput = Pick<
  NewExercise,
  'nameEn' | 'nameAr' | 'muscleGroup' | 'equipment'
> & {
  imageUri?: string | null;
};

export function createExercise(input: CreateExerciseInput, executor: DbExecutor = db): Exercise {
  return executor
    .insert(exercises)
    .values({ ...input, isCustom: true, createdAt: new Date().toISOString() })
    .returning()
    .get();
}

export function insertExercises(rows: readonly NewExercise[], executor: DbExecutor = db): void {
  if (rows.length === 0) return;
  executor
    .insert(exercises)
    .values([...rows])
    .run();
}

export type UpdateExerciseInput = Partial<
  Pick<NewExercise, 'nameEn' | 'nameAr' | 'muscleGroup' | 'equipment' | 'imageUri'>
>;

export function updateExercise(
  id: number,
  patch: UpdateExerciseInput,
  executor: DbExecutor = db,
): Exercise | undefined {
  return executor.update(exercises).set(patch).where(eq(exercises.id, id)).returning().get();
}

export function setExerciseArchived(
  id: number,
  isArchived: boolean,
  executor: DbExecutor = db,
): void {
  executor.update(exercises).set({ isArchived }).where(eq(exercises.id, id)).run();
}

export function isExerciseInUse(id: number, executor: DbExecutor = db): boolean {
  const inSets = executor
    .select({ id: sessionSets.id })
    .from(sessionSets)
    .where(eq(sessionSets.exerciseId, id))
    .limit(1)
    .get();
  if (inSets) return true;
  const inPrograms = executor
    .select({ id: programDayExercises.id })
    .from(programDayExercises)
    .where(eq(programDayExercises.exerciseId, id))
    .limit(1)
    .get();
  return Boolean(inPrograms);
}

/**
 * Deletes a custom exercise. Exercises referenced by history or a program are archived
 * instead so past workouts keep their data. Returns what happened.
 */
export function deleteCustomExercise(
  id: number,
  executor: DbExecutor = db,
): 'deleted' | 'archived' | 'notCustom' {
  const exercise = getExerciseById(id, executor);
  if (!exercise?.isCustom) return 'notCustom';
  if (isExerciseInUse(id, executor)) {
    setExerciseArchived(id, true, executor);
    return 'archived';
  }
  executor.delete(exercises).where(eq(exercises.id, id)).run();
  return 'deleted';
}

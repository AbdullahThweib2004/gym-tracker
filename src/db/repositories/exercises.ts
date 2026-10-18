import { and, asc, eq, inArray, isNull, like, or, sql, type SQL } from 'drizzle-orm';

import type { Equipment, MuscleGroup } from '@/constants/muscles';

import { db, type DbExecutor } from '../client';
import {
  exercises,
  programDayExercises,
  sessionExtraExercises,
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
  if (inPrograms) return true;
  const inSessions = executor
    .select({ id: sessionExtraExercises.id })
    .from(sessionExtraExercises)
    .where(eq(sessionExtraExercises.exerciseId, id))
    .limit(1)
    .get();
  return Boolean(inSessions);
}

/** True when any set (in any session) has been logged for the exercise. */
export function hasLoggedSets(id: number, executor: DbExecutor = db): boolean {
  return Boolean(
    executor
      .select({ id: sessionSets.id })
      .from(sessionSets)
      .where(eq(sessionSets.exerciseId, id))
      .limit(1)
      .get(),
  );
}

/**
 * Deletes a custom exercise that nothing refers to. Exercises with logged sets (or used in a
 * program or session) are not deleted — the caller can offer to archive them instead.
 */
export function deleteCustomExercise(
  id: number,
  executor: DbExecutor = db,
): 'deleted' | 'inUse' | 'notCustom' {
  const exercise = getExerciseById(id, executor);
  if (!exercise?.isCustom) return 'notCustom';
  if (isExerciseInUse(id, executor)) return 'inUse';
  executor.delete(exercises).where(eq(exercises.id, id)).run();
  return 'deleted';
}

/**
 * Sets the stable key of built-in exercises that don't have one yet, matched by English name.
 * Returns how many rows were updated. Custom exercises are never touched.
 */
export function backfillBuiltInKeys(
  keysByNameEn: ReadonlyMap<string, string>,
  executor: DbExecutor = db,
): number {
  const missing = executor
    .select({ id: exercises.id, nameEn: exercises.nameEn })
    .from(exercises)
    .where(and(eq(exercises.isCustom, false), isNull(exercises.key)))
    .all();
  let updated = 0;
  for (const row of missing) {
    const key = keysByNameEn.get(row.nameEn);
    if (!key) continue;
    // Skip if another row already owns this key (keys are unique).
    const taken = executor
      .select({ id: exercises.id })
      .from(exercises)
      .where(eq(exercises.key, key))
      .get();
    if (taken) continue;
    executor.update(exercises).set({ key }).where(eq(exercises.id, row.id)).run();
    updated++;
  }
  return updated;
}

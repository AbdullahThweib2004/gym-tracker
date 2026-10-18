import { db } from './client';
import { getMeta, META_KEYS, setMeta } from './repositories/appMeta';
import { backfillBuiltInKeys, insertExercises } from './repositories/exercises';
import { SEED_EXERCISES } from './seedData';

/**
 * Inserts the built-in exercise library once. Guarded by the `seeded` flag in appMeta and run
 * in a single transaction, so a crash mid-seed leaves the database untouched.
 * Returns true when seeding ran.
 */
export function seedDatabase(): boolean {
  if (getMeta(META_KEYS.seeded) === 'true') return false;

  const createdAt = new Date().toISOString();
  db.transaction((tx) => {
    insertExercises(
      SEED_EXERCISES.map((exercise) => ({
        ...exercise,
        isCustom: false,
        isArchived: false,
        createdAt,
      })),
      tx,
    );
    setMeta(META_KEYS.seeded, 'true', tx);
  });
  return true;
}

/**
 * Makes sure built-in exercises have their stable key. The 0003 migration backfills existing
 * rows; this also covers data restored from a backup made before keys existed. Cheap and
 * idempotent, so it runs on every start.
 */
export function ensureExerciseKeys(): number {
  return backfillBuiltInKeys(
    new Map(SEED_EXERCISES.map((exercise) => [exercise.nameEn, exercise.key])),
  );
}

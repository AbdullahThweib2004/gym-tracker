import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import type * as ShimModule from '@/test/expoSqliteShim';

import { openDatabase } from '../client';
import { replaceAllData, readBackupTables } from '../repositories/backup';
import { listExercises } from '../repositories/exercises';
import { ensureExerciseKeys, seedDatabase } from '../seed';
import { SEED_EXERCISES } from '../seedData';

// Real in-memory SQLite with the real migrations (babel-jest hoists jest.mock above imports).
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: () =>
    jest.requireActual<typeof ShimModule>('@/test/expoSqliteShim').openTestDatabase(),
}));

const MIGRATIONS = path.join(__dirname, '..', 'migrations');
const migrationFiles = fs
  .readdirSync(MIGRATIONS)
  .filter((f) => f.endsWith('.sql'))
  .sort();

function apply(db: DatabaseSync, file: string) {
  const sql = fs.readFileSync(path.join(MIGRATIONS, file), 'utf8');
  for (const statement of sql.split('--> statement-breakpoint'))
    if (statement.trim()) db.exec(statement);
}

describe('0003 exercise keys migration', () => {
  it('backfills keys for existing built-in exercises without touching ids, history or custom ones', () => {
    const db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    const keysMigration = migrationFiles.find((f) => f.startsWith('0003_'))!;
    for (const file of migrationFiles.filter((f) => f < keysMigration)) apply(db, file);

    const insert = db.prepare(
      'INSERT INTO exercises (name_en, name_ar, muscle_group, equipment, is_custom) VALUES (?, ?, ?, ?, ?)',
    );
    for (const e of SEED_EXERCISES) insert.run(e.nameEn, e.nameAr, e.muscleGroup, e.equipment, 0);
    insert.run('Sled Push', 'دفع الزلاجة', 'legs', 'other', 1);
    db.exec(
      "INSERT INTO workout_sessions (day_key, date, started_at) VALUES ('push', '2026-10-01', '2026-10-01T10:00:00Z');" +
        'INSERT INTO session_sets (session_id, exercise_id, set_number, weight_kg, reps) VALUES (1, 1, 1, 60, 10);',
    );

    apply(db, keysMigration);

    const rows = db
      .prepare(
        'SELECT id, key, name_en AS nameEn, is_custom AS isCustom FROM exercises ORDER BY id',
      )
      .all() as {
      id: number;
      key: string | null;
      nameEn: string;
      isCustom: number;
    }[];
    for (const [i, e] of SEED_EXERCISES.entries())
      expect(rows[i]).toMatchObject({ id: i + 1, key: e.key, nameEn: e.nameEn });
    expect(rows.find((r) => r.nameEn === "Farmer's Walk")?.key).toBe('farmers-walk');
    expect(rows.at(-1)).toMatchObject({ nameEn: 'Sled Push', key: null, isCustom: 1 });
    expect(db.prepare('SELECT exercise_id AS id FROM session_sets').get()).toEqual({ id: 1 });
  });
});

describe('ensureExerciseKeys', () => {
  beforeAll(async () => {
    await openDatabase();
    seedDatabase();
  });

  it('fills keys after restoring a backup made before keys existed, and is idempotent', () => {
    const data = readBackupTables();
    const withoutKeys = {
      ...data,
      exercises: data.exercises!.map(({ key: _key, ...rest }) => rest),
    };
    replaceAllData(withoutKeys);
    expect(listExercises().every((e) => e.key === null)).toBe(true);

    expect(ensureExerciseKeys()).toBe(SEED_EXERCISES.length);
    expect(ensureExerciseKeys()).toBe(0);
    const byName = new Map(listExercises().map((e) => [e.nameEn, e.key]));
    for (const e of SEED_EXERCISES) expect(byName.get(e.nameEn)).toBe(e.key);
  });
});

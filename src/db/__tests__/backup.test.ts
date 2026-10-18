import { getTableName } from 'drizzle-orm';

import {
  buildBackupFile,
  parseBackup,
  prepareImportData,
  previewBackup,
} from '@/features/backup/backupFormat';
import { chooseSplit, saveDayEntries } from '@/features/program/programService';
import {
  addExercisesToSession,
  finishWorkout,
  persistDraftRows,
  saveSet,
  startWorkout,
} from '@/features/workout/workoutService';
import type * as ShimModule from '@/test/expoSqliteShim';

import * as schema from '../schema';
import {
  ALL_TABLES,
  BACKUP_TABLES,
  EXCLUDED_META_KEYS,
  EXCLUDED_TABLES,
  SCHEMA_VERSION,
} from '../backupTables';
import { openDatabase } from '../client';
import journal from '../migrations/meta/_journal.json';
import { META_KEYS, setMeta } from '../repositories/appMeta';
import { readBackupTables, replaceAllData } from '../repositories/backup';
import { createExercise, listExercises } from '../repositories/exercises';
import { listProgramDays } from '../repositories/programDays';
import { getDraft } from '../repositories/setDrafts';
import { seedDatabase } from '../seed';

// Real in-memory SQLite with the real migrations (babel-jest hoists jest.mock above imports).
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: () =>
    jest.requireActual<typeof ShimModule>('@/test/expoSqliteShim').openTestDatabase(),
}));

let draftSessionId = 0;
let draftExerciseId = 0;

/** Puts at least one row in every backed-up table. */
function createFixture() {
  const custom = createExercise({
    nameEn: 'Sled Push',
    nameAr: 'دفع الزلاجة',
    muscleGroup: 'legs',
    equipment: 'other',
  });
  const { program } = chooseSplit('ppl');
  const days = listProgramDays(program.id);
  const ids = listExercises().map((e) => e.id);
  days.forEach((day, i) =>
    saveDayEntries(day.id, [
      {
        exerciseId: ids[i]!,
        targetSets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
        restSeconds: i === 0 ? 120 : null,
      },
    ]),
  );
  const session = startWorkout(program, days[0]!);
  saveSet({
    sessionId: session.id,
    exerciseId: ids[0]!,
    setNumber: 1,
    weightKg: 62.5,
    reps: 8,
    isWarmup: false,
  });
  saveSet({
    sessionId: session.id,
    exerciseId: ids[0]!,
    setNumber: 2,
    weightKg: 20,
    reps: 12,
    isWarmup: true,
  });
  addExercisesToSession(session.id, [custom.id]);
  finishWorkout(session.id);

  const open = startWorkout(program, days[1]!);
  persistDraftRows(open.id, ids[1]!, [
    { key: 'k', setId: null, weightKg: 50, reps: 5, isWarmup: false, state: 'edited' },
  ]);
  draftSessionId = open.id;
  draftExerciseId = ids[1]!;

  setMeta(META_KEYS.language, 'ar');
  setMeta(META_KEYS.defaultRestSeconds, '120');
  setMeta(META_KEYS.restTimer, JSON.stringify({ endAt: 1, totalMs: 1, notificationId: null }));
}

beforeAll(async () => {
  await openDatabase();
  seedDatabase();
  createFixture();
});

describe('backup table coverage', () => {
  it('handles every table in the Drizzle schema: backed up or explicitly excluded', () => {
    const schemaTables = Object.values(schema).filter((v) => ALL_TABLES.includes(v as never));
    expect(schemaTables.length).toBe(ALL_TABLES.length);
    const backedUp = BACKUP_TABLES.map(getTableName);
    for (const table of ALL_TABLES) {
      const name = getTableName(table);
      expect(backedUp.includes(name) || name in EXCLUDED_TABLES).toBe(true);
    }
    for (const name of Object.keys(EXCLUDED_TABLES))
      expect(ALL_TABLES.map(getTableName)).toContain(name);
    expect(backedUp).toContain('session_extra_exercises');
    expect(backedUp).not.toContain('set_drafts');
  });

  it('orders tables so parents are inserted before children', () => {
    const order = BACKUP_TABLES.map(getTableName);
    const before = (a: string, b: string) =>
      expect(order.indexOf(a)).toBeLessThan(order.indexOf(b));
    before('user_programs', 'program_days');
    before('program_days', 'program_day_exercises');
    before('exercises', 'session_sets');
    before('workout_sessions', 'session_sets');
    before('workout_sessions', 'session_extra_exercises');
  });

  it('ties the schema version to the latest migration', () => {
    expect(SCHEMA_VERSION).toBe(journal.entries.length);
  });

  it('the fixture covers every backed-up table (add fixture rows when adding a table)', () => {
    const data = readBackupTables();
    for (const table of BACKUP_TABLES)
      expect([getTableName(table), data[getTableName(table)]!.length > 0]).toEqual([
        getTableName(table),
        true,
      ]);
  });
});

describe('export → import round trip', () => {
  it('restores every backed-up table exactly and drops device-only data', () => {
    const before = readBackupTables();
    expect(before.app_meta!.map((r) => r.key)).not.toContain('restTimer');

    const file = buildBackupFile(before, '1.0.0', new Date('2026-10-18T12:00:00Z'));
    const text = JSON.stringify(file);
    const parsed = parseBackup(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    // Wipe everything, then restore.
    replaceAllData({});
    expect(Object.values(readBackupTables()).every((rows) => rows.length === 0)).toBe(true);

    replaceAllData(prepareImportData(parsed.backup, EXCLUDED_META_KEYS));
    expect(readBackupTables()).toEqual(before);
    expect(getDraft(draftSessionId, draftExerciseId)).toBeNull();
  });

  it('previews sessions, sets and the date range', () => {
    const preview = previewBackup(buildBackupFile(readBackupTables(), '1.0.0'));
    expect(preview).toMatchObject({ sessions: 2, sets: 2, customExercises: 1 });
    expect(preview.firstDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(preview.lastDate).toBe(preview.firstDate);
  });
});

describe('validation', () => {
  const valid = () => buildBackupFile(readBackupTables(), '1.0.0');

  it('rejects non-JSON and non-backup files', () => {
    expect(parseBackup('not json')).toEqual({ ok: false, error: { code: 'invalidJson' } });
    expect(parseBackup('{"hello":1}')).toEqual({ ok: false, error: { code: 'notABackup' } });
  });

  it('rejects backups from a newer schema with both versions', () => {
    const newer = { ...valid(), schemaVersion: SCHEMA_VERSION + 1 };
    expect(parseBackup(JSON.stringify(newer))).toEqual({
      ok: false,
      error: { code: 'newerSchema', fileVersion: SCHEMA_VERSION + 1, appVersion: SCHEMA_VERSION },
    });
  });

  it('accepts an older schema without the tables added later', () => {
    const { session_extra_exercises: _extras, ...data } = valid().data;
    const older = { ...valid(), schemaVersion: 1, data };
    const parsed = parseBackup(JSON.stringify(older));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.backup.data.session_extra_exercises).toEqual([]);
  });

  it('points at the bad field', () => {
    const file = valid();
    const sets = file.data.session_sets!.map((row, i) =>
      i === 0 ? { ...row, reps: 'eight' } : row,
    );
    const result = parseBackup(
      JSON.stringify({ ...file, data: { ...file.data, session_sets: sets } }),
    );
    expect(result).toEqual({
      ok: false,
      error: { code: 'invalidData', path: 'data.session_sets.0.reps' },
    });
  });
});

describe('atomic import', () => {
  it('rolls back completely when the backup cannot be inserted', () => {
    const before = readBackupTables();
    const broken = {
      ...before,
      session_sets: [
        ...before.session_sets!,
        { ...before.session_sets![0]!, id: 99_999, sessionId: 123_456 },
      ],
    };
    expect(() => replaceAllData(broken)).toThrow();
    expect(readBackupTables()).toEqual(before);
  });
});

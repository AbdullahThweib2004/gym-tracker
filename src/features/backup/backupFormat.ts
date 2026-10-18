import { z } from 'zod';

import { BACKUP_TABLES, getTableColumns, getTableName, SCHEMA_VERSION } from '@/db/backupTables';
import type { TableRows } from '@/db/repositories/backup';

export const BACKUP_APP_ID = 'gym-tracker';

export type BackupFile = {
  app: typeof BACKUP_APP_ID;
  schemaVersion: number;
  exportedAt: string;
  appVersion: string;
  data: TableRows;
};

/** A zod schema for one table's rows, built from its Drizzle columns. */
function rowSchema(table: (typeof BACKUP_TABLES)[number]) {
  const shape: Record<string, z.ZodType> = {};
  for (const [key, column] of Object.entries(getTableColumns(table))) {
    let field: z.ZodType;
    if (column.enumValues && column.enumValues.length > 0) {
      field = z.enum(column.enumValues as [string, ...string[]]);
    } else if (column.dataType === 'number') {
      field = column.columnType === 'SQLiteInteger' ? z.number().int() : z.number();
    } else if (column.dataType === 'boolean') {
      field = z.boolean();
    } else {
      field = z.string();
    }
    if (!column.notNull) field = field.nullable();
    // Older backups may lack newer columns: fine when the column has a default or allows null.
    if (column.hasDefault || !column.notNull) field = field.optional();
    shape[key] = field;
  }
  return z.object(shape);
}

const dataSchema = z.object(
  Object.fromEntries(
    BACKUP_TABLES.map((table) => [getTableName(table), z.array(rowSchema(table)).optional()]),
  ),
);

const fileSchema = z.object({
  app: z.literal(BACKUP_APP_ID),
  schemaVersion: z.number().int().min(1),
  exportedAt: z.string(),
  appVersion: z.string(),
  data: z.record(z.string(), z.unknown()),
});

export function buildBackupFile(data: TableRows, appVersion: string, now = new Date()): BackupFile {
  return {
    app: BACKUP_APP_ID,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    appVersion,
    data,
  };
}

/** "gym-tracker-backup-2026-10-18.json" (local date) */
export function backupFileName(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `gym-tracker-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

export type BackupError =
  | { code: 'invalidJson' }
  | { code: 'notABackup' }
  | { code: 'newerSchema'; fileVersion: number; appVersion: number }
  | { code: 'invalidData'; path: string };

export type ParsedBackup = { ok: true; backup: BackupFile } | { ok: false; error: BackupError };

/** Parses and validates backup JSON. Older schema versions are accepted; newer ones are not. */
export function parseBackup(text: string): ParsedBackup {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: { code: 'invalidJson' } };
  }
  const header = fileSchema.safeParse(json);
  if (!header.success) return { ok: false, error: { code: 'notABackup' } };
  if (header.data.schemaVersion > SCHEMA_VERSION) {
    return {
      ok: false,
      error: {
        code: 'newerSchema',
        fileVersion: header.data.schemaVersion,
        appVersion: SCHEMA_VERSION,
      },
    };
  }
  const data = dataSchema.safeParse(header.data.data);
  if (!data.success) {
    const issue = data.error.issues[0];
    return {
      ok: false,
      error: { code: 'invalidData', path: issue ? ['data', ...issue.path].join('.') : 'data' },
    };
  }
  // Every table this build knows about, empty when an older backup didn't have it yet.
  const parsed = data.data as Record<string, Record<string, unknown>[] | undefined>;
  const tables: TableRows = Object.fromEntries(
    BACKUP_TABLES.map((table) => [getTableName(table), parsed[getTableName(table)] ?? []]),
  );
  return { ok: true, backup: { ...header.data, app: BACKUP_APP_ID, data: tables } };
}

export type BackupPreview = {
  sessions: number;
  sets: number;
  customExercises: number;
  firstDate: string | null;
  lastDate: string | null;
  exportedAt: string;
  schemaVersion: number;
};

export function previewBackup(backup: BackupFile): BackupPreview {
  const sessions = (backup.data.workout_sessions ?? []) as { date?: string }[];
  const dates = sessions
    .map((s) => s.date)
    .filter((d): d is string => typeof d === 'string')
    .sort();
  const exercises = (backup.data.exercises ?? []) as { isCustom?: boolean }[];
  return {
    sessions: sessions.length,
    sets: (backup.data.session_sets ?? []).length,
    customExercises: exercises.filter((e) => e.isCustom).length,
    firstDate: dates[0] ?? null,
    lastDate: dates[dates.length - 1] ?? null,
    exportedAt: backup.exportedAt,
    schemaVersion: backup.schemaVersion,
  };
}

/**
 * Data ready to write: drops device-only meta keys and makes sure a restored exercise library
 * isn't seeded a second time on the next launch.
 */
export function prepareImportData(
  backup: BackupFile,
  excludedMetaKeys: readonly string[],
): TableRows {
  const meta = ((backup.data.app_meta ?? []) as { key: string; value: string }[]).filter(
    (row) => !excludedMetaKeys.includes(row.key),
  );
  if ((backup.data.exercises ?? []).length > 0 && !meta.some((row) => row.key === 'seeded')) {
    meta.push({ key: 'seeded', value: 'true' });
  }
  return { ...backup.data, app_meta: meta };
}

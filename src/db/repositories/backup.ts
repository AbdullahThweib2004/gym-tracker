import { getTableName, notInArray } from 'drizzle-orm';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';

import { ALL_TABLES_IN_ORDER, BACKUP_TABLES, EXCLUDED_META_KEYS } from '../backupTables';
import { db } from '../client';
import { appMeta } from '../schema';

export type TableRows = Record<string, Record<string, unknown>[]>;

/** Every backed-up table's rows, keyed by SQL table name. */
export function readBackupTables(): TableRows {
  const data: TableRows = {};
  for (const table of BACKUP_TABLES) {
    data[getTableName(table)] =
      table === appMeta
        ? db
            .select()
            .from(appMeta)
            .where(notInArray(appMeta.key, [...EXCLUDED_META_KEYS]))
            .all()
        : (db
            .select()
            .from(table as SQLiteTable)
            .all() as Record<string, unknown>[]);
  }
  return data;
}

/** SQLite allows a limited number of bound variables per statement. */
const MAX_VARIABLES = 900;

/**
 * Replaces ALL data with `data` in one transaction: every table (excluded ones too) is
 * emptied children-first, then the backup is inserted parents-first. Any error rolls back
 * everything, leaving the current data untouched.
 */
export function replaceAllData(data: TableRows): void {
  db.transaction((tx) => {
    for (const table of [...ALL_TABLES_IN_ORDER].reverse()) tx.delete(table).run();
    for (const table of BACKUP_TABLES) {
      const rows = data[getTableName(table)] ?? [];
      if (rows.length === 0) continue;
      const columns = Math.max(1, Object.keys(rows[0]!).length);
      const chunkSize = Math.max(1, Math.floor(MAX_VARIABLES / columns));
      for (let i = 0; i < rows.length; i += chunkSize) {
        tx.insert(table)
          .values(rows.slice(i, i + chunkSize) as never)
          .run();
      }
    }
  });
}

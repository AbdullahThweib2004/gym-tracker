import { getTableColumns, getTableName, is } from 'drizzle-orm';
import { getTableConfig, SQLiteTable } from 'drizzle-orm/sqlite-core';

import journal from './migrations/meta/_journal.json';
import * as schema from './schema';

/**
 * Tables deliberately left out of backups, with the reason. Everything else in the schema is
 * backed up automatically — a new table is included without touching this file.
 */
export const EXCLUDED_TABLES: Readonly<Record<string, string>> = {
  set_drafts: 'unconfirmed set edits of an open workout; device-local scratch data',
};

/** app_meta keys that describe this device's state, not user data. */
export const EXCLUDED_META_KEYS: readonly string[] = [
  'restTimer',
  'restNotificationsAsked',
  'directionReloadPending',
];

/** Every table defined in the Drizzle schema. */
export const ALL_TABLES: readonly SQLiteTable[] = (Object.values(schema) as unknown[]).filter(
  (value): value is SQLiteTable => is(value, SQLiteTable),
);

function foreignTables(table: SQLiteTable): SQLiteTable[] {
  return getTableConfig(table).foreignKeys.map((fk) => fk.reference().foreignTable);
}

/** Tables ordered so every table comes after the tables it references (insert order). */
export function sortByDependencies(tables: readonly SQLiteTable[]): SQLiteTable[] {
  const sorted: SQLiteTable[] = [];
  const visiting = new Set<SQLiteTable>();
  const visit = (table: SQLiteTable) => {
    if (sorted.includes(table)) return;
    if (visiting.has(table)) throw new Error(`Circular foreign keys at ${getTableName(table)}`);
    visiting.add(table);
    for (const parent of foreignTables(table))
      if (parent !== table && tables.includes(parent)) visit(parent);
    visiting.delete(table);
    sorted.push(table);
  };
  // Name order first so the result is deterministic.
  [...tables].sort((a, b) => getTableName(a).localeCompare(getTableName(b))).forEach(visit);
  return sorted;
}

/** Backed-up tables in insert order (parents first). */
export const BACKUP_TABLES: readonly SQLiteTable[] = sortByDependencies(
  ALL_TABLES.filter((table) => !(getTableName(table) in EXCLUDED_TABLES)),
);

/** All tables in insert order — reverse it to delete safely. */
export const ALL_TABLES_IN_ORDER: readonly SQLiteTable[] = sortByDependencies(ALL_TABLES);

/** The schema version of this build: the number of applied migrations. */
export const SCHEMA_VERSION: number = journal.entries.length;

export { getTableColumns, getTableName };

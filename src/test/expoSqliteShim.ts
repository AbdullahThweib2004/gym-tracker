/**
 * Test-only stand-in for expo-sqlite's synchronous API, backed by Node's built-in SQLite.
 * Implements just what drizzle-orm/expo-sqlite uses, so repositories run against a real
 * in-memory database with the real migrations.
 */
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

type Params = (string | number | bigint | null | Uint8Array)[];

const MIGRATIONS_DIR = path.join(__dirname, '..', 'db', 'migrations');

function applyMigrations(db: DatabaseSync): void {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    for (const statement of sql.split('--> statement-breakpoint')) {
      if (statement.trim()) db.exec(statement);
    }
  }
}

export function openTestDatabase() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  applyMigrations(db);

  return {
    execSync(source: string) {
      db.exec(source);
    },
    prepareSync(source: string) {
      const stmt = db.prepare(source);
      const rawStmt = db.prepare(source);
      rawStmt.setReturnArrays(true);
      return {
        executeSync(params: Params = []) {
          const isQuery = stmt.columns().length > 0;
          if (isQuery) {
            const rows = stmt.all(...params);
            return {
              changes: 0,
              lastInsertRowId: 0,
              getAllSync: () => rows,
              getFirstSync: () => rows[0] ?? null,
            };
          }
          const result = stmt.run(...params);
          return {
            changes: Number(result.changes),
            lastInsertRowId: Number(result.lastInsertRowid),
            getAllSync: () => [],
            getFirstSync: () => null,
          };
        },
        executeForRawResultSync(params: Params = []) {
          const rows = rawStmt.all(...params);
          return { getAllSync: () => rows };
        },
        finalizeSync() {},
      };
    },
  };
}

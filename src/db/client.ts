import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { openDatabaseAsync, openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

import * as schema from './schema';

export const DATABASE_NAME = 'gym-tracker.db';

const OPEN_OPTIONS = { enableChangeListener: true };

export type Database = ExpoSQLiteDatabase<typeof schema> & { $client: SQLiteDatabase };
/** A transaction handle or the db itself; repositories accept either. */
export type DbExecutor = Database | Parameters<Parameters<Database['transaction']>[0]>[0];

let instance: Database | null = null;
let opening: Promise<Database> | null = null;

/**
 * Opens the database once. Must finish before anything touches `db`.
 *
 * On web, expo-sqlite runs SQLite (WebAssembly) in a worker, and its synchronous calls only
 * busy-wait a few milliseconds for a reply. Opening asynchronously waits for the worker and
 * the .wasm to load; the returned database also supports the sync API Drizzle uses.
 */
export function openDatabase(): Promise<Database> {
  opening ??= (async () => {
    const expoDb =
      Platform.OS === 'web'
        ? await openDatabaseAsync(DATABASE_NAME, OPEN_OPTIONS)
        : openDatabaseSync(DATABASE_NAME, OPEN_OPTIONS);
    // WAL needs shared memory, which the web VFS doesn't provide.
    if (Platform.OS !== 'web') expoDb.execSync('PRAGMA journal_mode = WAL;');
    expoDb.execSync('PRAGMA foreign_keys = ON;');
    instance = drizzle(expoDb, { schema });
    return instance;
  })();
  opening.catch(() => {
    opening = null;
  });
  return opening;
}

function getDb(): Database {
  if (!instance) throw new Error('Database used before openDatabase() finished');
  return instance;
}

/** The app database. Only usable after `openDatabase()` resolves (the root layout waits for it). */
export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const real = getDb();
    const value: unknown = Reflect.get(real, prop, real);
    return typeof value === 'function' ? value.bind(real) : value;
  },
});

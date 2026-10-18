import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

export const DATABASE_NAME = 'gym-tracker.db';

const expoDb = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });
expoDb.execSync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

export const db = drizzle(expoDb, { schema });

export type Database = typeof db;
/** A transaction handle or the db itself; repositories accept either. */
export type DbExecutor = Database | Parameters<Parameters<Database['transaction']>[0]>[0];

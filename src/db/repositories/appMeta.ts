import { eq } from 'drizzle-orm';

import { db, type DbExecutor } from '../client';
import { appMeta } from '../schema';

export const META_KEYS = {
  seeded: 'seeded',
  language: 'language',
  defaultRestSeconds: 'defaultRestSeconds',
  lastBackupAt: 'lastBackupAt',
  directionReloadPending: 'directionReloadPending',
  restTimer: 'restTimer',
  autoStartRest: 'autoStartRest',
  restAlerts: 'restAlerts',
  restNotificationsAsked: 'restNotificationsAsked',
  backupReminderDismissedAt: 'backupReminderDismissedAt',
} as const;

export type MetaKey = (typeof META_KEYS)[keyof typeof META_KEYS];

export function getMeta(key: MetaKey, executor: DbExecutor = db): string | null {
  const row = executor.select().from(appMeta).where(eq(appMeta.key, key)).get();
  return row?.value ?? null;
}

export function setMeta(key: MetaKey, value: string, executor: DbExecutor = db): void {
  executor
    .insert(appMeta)
    .values({ key, value })
    .onConflictDoUpdate({ target: appMeta.key, set: { value } })
    .run();
}

export function deleteMeta(key: MetaKey, executor: DbExecutor = db): void {
  executor.delete(appMeta).where(eq(appMeta.key, key)).run();
}

export function getAllMeta(executor: DbExecutor = db): Partial<Record<MetaKey, string>> {
  const rows = executor.select().from(appMeta).all();
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export function getNumberMeta(key: MetaKey, executor: DbExecutor = db): number | null {
  const raw = getMeta(key, executor);
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function getBooleanMeta(key: MetaKey, executor: DbExecutor = db): boolean {
  return getMeta(key, executor) === 'true';
}

const DAY = 24 * 60 * 60 * 1000;
export const BACKUP_REMINDER_DAYS = 14;
export const MIN_SESSIONS_FOR_FIRST_REMINDER = 3;

/**
 * Remind when the last backup is older than 14 days, or there has never been one once there
 * are 3+ workouts. Dismissing hides it for another 14 days.
 */
export function shouldShowBackupReminder({
  lastBackupAt,
  dismissedAt,
  finishedSessions,
  now,
}: {
  lastBackupAt: string | null;
  dismissedAt: string | null;
  finishedSessions: number;
  now: Date;
}): boolean {
  const olderThan = (iso: string | null, days: number) =>
    !iso || now.getTime() - new Date(iso).getTime() > days * DAY;
  if (!olderThan(dismissedAt, BACKUP_REMINDER_DAYS)) return false;
  if (lastBackupAt) return olderThan(lastBackupAt, BACKUP_REMINDER_DAYS);
  return finishedSessions >= MIN_SESSIONS_FOR_FIRST_REMINDER;
}

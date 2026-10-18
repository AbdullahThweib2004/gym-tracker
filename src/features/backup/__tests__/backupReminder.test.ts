import { shouldShowBackupReminder } from '../backupReminder';

const now = new Date('2026-10-18T12:00:00Z');
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

describe('shouldShowBackupReminder', () => {
  it('reminds when the last backup is older than 14 days', () => {
    expect(
      shouldShowBackupReminder({
        lastBackupAt: daysAgo(15),
        dismissedAt: null,
        finishedSessions: 1,
        now,
      }),
    ).toBe(true);
    expect(
      shouldShowBackupReminder({
        lastBackupAt: daysAgo(3),
        dismissedAt: null,
        finishedSessions: 50,
        now,
      }),
    ).toBe(false);
  });

  it('reminds about a first backup only once there are 3+ workouts', () => {
    expect(
      shouldShowBackupReminder({ lastBackupAt: null, dismissedAt: null, finishedSessions: 2, now }),
    ).toBe(false);
    expect(
      shouldShowBackupReminder({ lastBackupAt: null, dismissedAt: null, finishedSessions: 3, now }),
    ).toBe(true);
  });

  it('stays hidden for 14 days after dismissing', () => {
    expect(
      shouldShowBackupReminder({
        lastBackupAt: null,
        dismissedAt: daysAgo(2),
        finishedSessions: 9,
        now,
      }),
    ).toBe(false);
    expect(
      shouldShowBackupReminder({
        lastBackupAt: null,
        dismissedAt: daysAgo(20),
        finishedSessions: 9,
        now,
      }),
    ).toBe(true);
  });
});

import { weekActivity, weekProgress } from '../weekActivity';

// Wednesday 14 Oct 2026
const now = new Date(2026, 9, 14, 18);

describe('weekActivity', () => {
  it('returns the 7 days of the week starting on the given day', () => {
    const days = weekActivity([], now, 1);
    expect(days.map((d) => d.date)).toEqual([
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
      '2026-10-18',
    ]);
    expect(days.filter((d) => d.isToday).map((d) => d.date)).toEqual(['2026-10-14']);
    expect(days.filter((d) => d.isFuture)).toHaveLength(4);
    expect(weekActivity([], now, 0)[0]?.date).toBe('2026-10-11');
  });

  it('marks trained days and counts progress, ignoring other weeks', () => {
    const days = weekActivity(['2026-10-12', '2026-10-14', '2026-10-14', '2026-10-05'], now, 1);
    expect(days.filter((d) => d.trained).map((d) => d.date)).toEqual(['2026-10-12', '2026-10-14']);
    expect(weekProgress(days, 3)).toEqual({ done: 2, goal: 3 });
  });
});

import { groupByWeek, startOfWeek } from '../weekGroups';

// Sunday 18 Oct 2026
const now = new Date(2026, 9, 18, 12);

describe('startOfWeek', () => {
  it('respects the first day of the week', () => {
    expect(startOfWeek(now, 1).getDate()).toBe(12); // Monday
    expect(startOfWeek(now, 0).getDate()).toBe(18); // Sunday
    expect(startOfWeek(now, 6).getDate()).toBe(17); // Saturday
  });
});

describe('groupByWeek', () => {
  const items = ['2026-10-18', '2026-10-12', '2026-10-11', '2026-10-05', '2026-09-20'];

  it('labels this week and last week, then date ranges, newest first', () => {
    const groups = groupByWeek(items, (d) => d, now, 1);
    expect(groups.map((g) => [g.kind, g.start, g.end, g.items])).toEqual([
      ['thisWeek', '2026-10-12', '2026-10-18', ['2026-10-18', '2026-10-12']],
      ['lastWeek', '2026-10-05', '2026-10-11', ['2026-10-11', '2026-10-05']],
      ['range', '2026-09-14', '2026-09-20', ['2026-09-20']],
    ]);
  });

  it('uses the given week start', () => {
    const groups = groupByWeek(items, (d) => d, now, 0);
    expect(groups[0]).toMatchObject({ kind: 'thisWeek', items: ['2026-10-18'] });
    expect(groups[1]).toMatchObject({ kind: 'lastWeek', items: ['2026-10-12', '2026-10-11'] });
  });

  it('returns nothing for no items', () => {
    expect(groupByWeek([], (d: string) => d, now, 1)).toEqual([]);
  });
});

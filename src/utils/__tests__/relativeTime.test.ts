import { calendarDaysAgo, getElapsedTime } from '../relativeTime';

const now = new Date(2026, 9, 18, 12, 0, 0);

describe('getElapsedTime', () => {
  it('buckets elapsed time', () => {
    expect(getElapsedTime(new Date(2026, 9, 18, 11, 59, 30), now)).toEqual({ unit: 'justNow' });
    expect(getElapsedTime(new Date(2026, 9, 18, 11, 35), now)).toEqual({
      unit: 'minutes',
      count: 25,
    });
    expect(getElapsedTime(new Date(2026, 9, 18, 9, 0), now)).toEqual({ unit: 'hours', count: 3 });
    expect(getElapsedTime(new Date(2026, 9, 16, 11, 0), now)).toEqual({ unit: 'days', count: 2 });
  });

  it('never goes negative', () => {
    expect(getElapsedTime(new Date(2026, 9, 18, 13, 0), now)).toEqual({ unit: 'justNow' });
  });
});

describe('calendarDaysAgo', () => {
  it('counts calendar days, not 24h periods', () => {
    expect(calendarDaysAgo('2026-10-18', now)).toBe(0);
    expect(calendarDaysAgo('2026-10-17', new Date(2026, 9, 18, 0, 5))).toBe(1);
    expect(calendarDaysAgo('2026-10-15', now)).toBe(3);
  });
});

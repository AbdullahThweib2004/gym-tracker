import { calendarDaysAgo } from '../relativeTime';

const now = new Date(2026, 9, 18, 12, 0, 0);

describe('calendarDaysAgo', () => {
  it('counts calendar days, not 24h periods', () => {
    expect(calendarDaysAgo('2026-10-18', now)).toBe(0);
    expect(calendarDaysAgo('2026-10-17', new Date(2026, 9, 18, 0, 5))).toBe(1);
    expect(calendarDaysAgo('2026-10-15', now)).toBe(3);
  });
});

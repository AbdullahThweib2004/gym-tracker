import { parseIsoDate, toDate, toIsoDate } from '../date';

describe('date utils', () => {
  it('formats local dates as YYYY-MM-DD', () => {
    expect(toIsoDate(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });

  it('round-trips an ISO date in local time', () => {
    const date = parseIsoDate('2026-10-18');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(9);
    expect(date.getDate()).toBe(18);
    expect(toIsoDate(date)).toBe('2026-10-18');
  });

  it('accepts timestamps and plain dates', () => {
    expect(toDate('2026-10-18').getDate()).toBe(18);
    expect(toDate('2026-10-18T10:00:00.000Z').toISOString()).toBe('2026-10-18T10:00:00.000Z');
  });
});

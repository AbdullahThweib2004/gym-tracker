import { suggestNextDayId } from '../nextDay';

const days = [{ id: 10 }, { id: 11 }, { id: 12 }];

describe('suggestNextDayId', () => {
  it('suggests the first day when nothing is finished', () => {
    expect(suggestNextDayId(days, null)).toBe(10);
    expect(suggestNextDayId(days, undefined)).toBe(10);
  });

  it('suggests the day after the last finished one', () => {
    expect(suggestNextDayId(days, 10)).toBe(11);
    expect(suggestNextDayId(days, 11)).toBe(12);
  });

  it('wraps around after the last day', () => {
    expect(suggestNextDayId(days, 12)).toBe(10);
  });

  it('falls back to the first day for a day from another program', () => {
    expect(suggestNextDayId(days, 99)).toBe(10);
  });

  it('returns null for a program without days', () => {
    expect(suggestNextDayId([], 10)).toBeNull();
  });
});

import { buildPrefill, prefillFor } from '../prefill';

const last = [
  { weightKg: 60, reps: 10 },
  { weightKg: 60, reps: 8 },
  { weightKg: 55, reps: 10 },
];

describe('buildPrefill', () => {
  it('uses the set with the same number', () => {
    expect(buildPrefill(last, 3)).toEqual(last);
  });

  it('repeats the final set when last time had fewer sets', () => {
    expect(buildPrefill(last.slice(0, 2), 4)).toEqual([
      { weightKg: 60, reps: 10 },
      { weightKg: 60, reps: 8 },
      { weightKg: 60, reps: 8 },
      { weightKg: 60, reps: 8 },
    ]);
  });

  it('ignores extra sets beyond the target', () => {
    expect(buildPrefill(last, 2)).toEqual(last.slice(0, 2));
  });

  it('returns empty suggestions without history', () => {
    expect(buildPrefill([], 3)).toEqual([null, null, null]);
    expect(buildPrefill(last, 0)).toEqual([]);
  });

  it('returns copies, not the original objects', () => {
    const result = prefillFor(last, 0);
    expect(result).toEqual(last[0]);
    expect(result).not.toBe(last[0]);
  });
});

import {
  appendRow,
  buildInitialRows,
  countWorkingSaved,
  validateRow,
  workingOrdinals,
} from '../setRows';

const last = [
  { weightKg: 60, reps: 10 },
  { weightKg: 60, reps: 8 },
];

describe('buildInitialRows', () => {
  it('creates suggested rows from last time when nothing is logged', () => {
    const rows = buildInitialRows([], last, 3);
    expect(rows.map((r) => [r.weightKg, r.reps, r.state])).toEqual([
      [60, 10, 'suggested'],
      [60, 8, 'suggested'],
      [60, 8, 'suggested'],
    ]);
  });

  it('creates empty rows without history', () => {
    expect(buildInitialRows([], [], 2).map((r) => [r.weightKg, r.reps])).toEqual([
      [null, null],
      [null, null],
    ]);
  });

  it('restores saved sets in order and only fills the remaining working sets', () => {
    const saved = [
      { id: 7, setNumber: 2, weightKg: 62.5, reps: 8, isWarmup: false },
      { id: 5, setNumber: 1, weightKg: 20, reps: 12, isWarmup: true },
    ];
    const rows = buildInitialRows(saved, last, 3);
    expect(rows.map((r) => [r.setId, r.weightKg, r.state])).toEqual([
      [5, 20, 'saved'],
      [7, 62.5, 'saved'],
      [null, 60, 'suggested'],
      [null, 60, 'suggested'],
    ]);
    // The first suggestion continues from last time's 2nd set (one working set is done).
    expect(rows[2]?.reps).toBe(8);
    expect(countWorkingSaved(rows)).toBe(1);
  });

  it('adds no suggestions once the target is met', () => {
    const saved = [1, 2, 3].map((n) => ({
      id: n,
      setNumber: n,
      weightKg: 50,
      reps: 10,
      isWarmup: false,
    }));
    expect(buildInitialRows(saved, last, 3)).toHaveLength(3);
  });
});

describe('appendRow', () => {
  it('copies the previous row as a suggestion', () => {
    const rows = buildInitialRows(
      [{ id: 1, setNumber: 1, weightKg: 70, reps: 6, isWarmup: false }],
      [],
      1,
    );
    const next = appendRow(rows, last);
    expect(next).toHaveLength(2);
    expect(next[1]).toMatchObject({
      weightKg: 70,
      reps: 6,
      state: 'suggested',
      setId: null,
      isWarmup: false,
    });
  });

  it('starts from last time when there are no rows', () => {
    expect(appendRow([], last)[0]).toMatchObject({ weightKg: 60, reps: 10 });
    expect(appendRow([], [])[0]).toMatchObject({ weightKg: null, reps: null });
  });
});

describe('validateRow', () => {
  it('accepts weight ≥ 0 and whole reps ≥ 1', () => {
    expect(validateRow({ weightKg: 0, reps: 1 })).toEqual({ ok: true, weightKg: 0, reps: 1 });
    expect(validateRow({ weightKg: 62.5, reps: 8 }).ok).toBe(true);
  });

  it('flags the invalid fields', () => {
    expect(validateRow({ weightKg: null, reps: 0 })).toEqual({
      ok: false,
      weight: true,
      reps: true,
    });
    expect(validateRow({ weightKg: -5, reps: 8 })).toEqual({
      ok: false,
      weight: true,
      reps: false,
    });
    expect(validateRow({ weightKg: 10, reps: 2.5 })).toEqual({
      ok: false,
      weight: false,
      reps: true,
    });
  });
});

describe('workingOrdinals', () => {
  it('numbers working sets and skips warm-ups', () => {
    expect(workingOrdinals([{ isWarmup: true }, { isWarmup: false }, { isWarmup: false }])).toEqual(
      [null, 1, 2],
    );
  });
});

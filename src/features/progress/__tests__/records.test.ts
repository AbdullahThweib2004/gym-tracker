import { bestSet, detectPRs, sessionRecords } from '../records';

const history = [
  { weightKg: 60, reps: 10 },
  { weightKg: 65, reps: 6 },
  { weightKg: 62.5, reps: 8 },
];

describe('bestSet', () => {
  it('picks the heaviest set, tie-broken by reps, ignoring warm-ups', () => {
    expect(
      bestSet([
        { weightKg: 100, reps: 5, isWarmup: true },
        { weightKg: 65, reps: 5, isWarmup: false },
        { weightKg: 65, reps: 7, isWarmup: false },
      ]),
    ).toEqual({ weightKg: 65, reps: 7, isWarmup: false });
  });
});

describe('detectPRs', () => {
  it('detects a heavier weight (and the higher 1RM that comes with it)', () => {
    // 67.5 × 6 ≈ 81 kg e1RM beats 60 × 10 (80); 67.5 × 5 (78.75) would be a weight PR only.
    expect(detectPRs({ weightKg: 67.5, reps: 6 }, history)).toEqual(['heaviestWeight', 'best1RM']);
    expect(detectPRs({ weightKg: 67.5, reps: 5 }, history)).toEqual(['heaviestWeight']);
  });

  it('detects more reps at a weight already lifted', () => {
    expect(detectPRs({ weightKg: 65, reps: 7 }, history)).toEqual(['best1RM', 'mostRepsAtWeight']);
  });

  it('counts heavier sets when judging reps at a weight', () => {
    // 9 reps at 62.5 beats the 8 at 62.5 and the 6 at 65.
    expect(detectPRs({ weightKg: 62.5, reps: 9 }, history)).toContain('mostRepsAtWeight');
    // 9 reps at 60 doesn't beat the 10 at 60.
    expect(detectPRs({ weightKg: 60, reps: 9 }, history)).toEqual([]);
  });

  it('reports nothing for an equal set or without history', () => {
    expect(detectPRs({ weightKg: 65, reps: 6 }, history)).toEqual([]);
    expect(detectPRs({ weightKg: 200, reps: 1 }, [])).toEqual([]);
  });
});

describe('sessionRecords', () => {
  it('compares each set with history and the session’s earlier sets', () => {
    const prior = [{ exerciseId: 1, weightKg: 60, reps: 8, isWarmup: false }];
    const session = [
      { id: 'a', exerciseId: 1, weightKg: 20, reps: 15, isWarmup: true },
      { id: 'b', exerciseId: 1, weightKg: 62.5, reps: 8, isWarmup: false },
      { id: 'c', exerciseId: 1, weightKg: 62.5, reps: 8, isWarmup: false },
      { id: 'd', exerciseId: 2, weightKg: 30, reps: 10, isWarmup: false },
    ];
    const result = sessionRecords(session, prior);
    // Only 'b' is a PR: 'c' merely ties it, and exercise 2 has no history.
    expect(result.map((r) => [r.set.id, r.records])).toEqual([
      ['b', ['heaviestWeight', 'best1RM']],
    ]);
  });
});

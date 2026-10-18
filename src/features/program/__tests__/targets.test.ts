import { normalizeTargets } from '../targets';

describe('normalizeTargets', () => {
  it('clamps sets and reps into range', () => {
    expect(normalizeTargets({ targetSets: 0, targetRepsMin: 0, targetRepsMax: 99 })).toEqual({
      targetSets: 1,
      targetRepsMin: 1,
      targetRepsMax: 50,
    });
    expect(
      normalizeTargets({ targetSets: 12, targetRepsMin: 8, targetRepsMax: 12 }).targetSets,
    ).toBe(10);
  });

  it('keeps min ≤ max, following the edited field', () => {
    expect(
      normalizeTargets({ targetSets: 3, targetRepsMin: 14, targetRepsMax: 12 }, 'min'),
    ).toEqual({
      targetSets: 3,
      targetRepsMin: 14,
      targetRepsMax: 14,
    });
    expect(normalizeTargets({ targetSets: 3, targetRepsMin: 8, targetRepsMax: 6 }, 'max')).toEqual({
      targetSets: 3,
      targetRepsMin: 6,
      targetRepsMax: 6,
    });
  });
});

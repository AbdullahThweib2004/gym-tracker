import { overloadIncrement, suggestNextWeight } from '../overload';

const target = { targetRepsMin: 8, targetRepsMax: 12 };
const bench = { muscleGroup: 'chest', equipment: 'barbell' } as const;

describe('overloadIncrement', () => {
  it('uses +5 kg for barbell/machine legs and glutes', () => {
    expect(overloadIncrement({ muscleGroup: 'legs', equipment: 'barbell' })).toBe(5);
    expect(overloadIncrement({ muscleGroup: 'glutes', equipment: 'machine' })).toBe(5);
    expect(overloadIncrement({ muscleGroup: 'legs', equipment: 'dumbbell' })).toBe(2.5);
  });

  it('uses +1 kg for dumbbell work on small muscles', () => {
    for (const muscleGroup of ['biceps', 'triceps', 'shoulders', 'forearms', 'calves'] as const) {
      expect(overloadIncrement({ muscleGroup, equipment: 'dumbbell' })).toBe(1);
    }
    expect(overloadIncrement({ muscleGroup: 'biceps', equipment: 'cable' })).toBe(2.5);
  });

  it('defaults to +2.5 kg', () => {
    expect(overloadIncrement(bench)).toBe(2.5);
    expect(overloadIncrement({ muscleGroup: 'back', equipment: 'cable' })).toBe(2.5);
  });
});

describe('suggestNextWeight', () => {
  it('increases when every set reached the top of the range', () => {
    const sets = [12, 12, 13].map((reps) => ({ weightKg: 60, reps }));
    expect(suggestNextWeight(sets, target, bench)).toEqual({
      weightKg: 62.5,
      reasonKey: 'increase',
      incrementKg: 2.5,
    });
    expect(
      suggestNextWeight(sets, target, { muscleGroup: 'legs', equipment: 'barbell' })?.weightKg,
    ).toBe(65);
    expect(
      suggestNextWeight(sets, target, { muscleGroup: 'biceps', equipment: 'dumbbell' })?.weightKg,
    ).toBe(61);
  });

  it('keeps the weight when any set missed the bottom of the range', () => {
    const sets = [10, 9, 7].map((reps) => ({ weightKg: 60, reps }));
    expect(suggestNextWeight(sets, target, bench)).toEqual({
      weightKg: 60,
      reasonKey: 'buildReps',
      incrementKg: 0,
    });
  });

  it('keeps the weight and asks for more reps in between', () => {
    const sets = [12, 10, 9].map((reps) => ({ weightKg: 60, reps }));
    expect(suggestNextWeight(sets, target, bench)).toEqual({
      weightKg: 60,
      reasonKey: 'moreReps',
      incrementKg: 0,
    });
  });

  it('works from the heaviest set and needs history', () => {
    const sets = [
      { weightKg: 55, reps: 12 },
      { weightKg: 60, reps: 12 },
    ];
    expect(suggestNextWeight(sets, target, bench)?.weightKg).toBe(62.5);
    expect(suggestNextWeight([], target, bench)).toBeNull();
  });
});

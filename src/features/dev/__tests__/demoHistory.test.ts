import { buildDemoHistory, mulberry32 } from '../demoHistory';

const days = [
  {
    programDayId: 1,
    dayKey: 'push',
    exercises: [
      {
        exerciseId: 10,
        muscleGroup: 'chest',
        equipment: 'barbell',
        targetSets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
      },
      {
        exerciseId: 11,
        muscleGroup: 'triceps',
        equipment: 'cable',
        targetSets: 3,
        targetRepsMin: 10,
        targetRepsMax: 15,
      },
    ],
  },
  {
    programDayId: 2,
    dayKey: 'legs',
    exercises: [
      {
        exerciseId: 20,
        muscleGroup: 'legs',
        equipment: 'barbell',
        targetSets: 4,
        targetRepsMin: 6,
        targetRepsMax: 8,
      },
      {
        exerciseId: 21,
        muscleGroup: 'abs',
        equipment: 'bodyweight',
        targetSets: 3,
        targetRepsMin: 12,
        targetRepsMax: 20,
      },
    ],
  },
] as const;

const now = new Date(2026, 9, 18, 12);
const history = buildDemoHistory(days, { weeks: 8, now, seed: 7 });
const working = (exerciseId: number) =>
  history.flatMap((s) => s.sets.filter((set) => set.exerciseId === exerciseId && !set.isWarmup));

describe('buildDemoHistory', () => {
  it('creates one finished session per day per week, in the past and in order', () => {
    expect(history).toHaveLength(16);
    for (const session of history) {
      expect(new Date(session.finishedAt).getTime()).toBeLessThan(now.getTime());
      expect(new Date(session.finishedAt).getTime()).toBeGreaterThan(
        new Date(session.startedAt).getTime(),
      );
    }
    const starts = history.map((s) => s.startedAt);
    expect([...starts].sort()).toEqual(starts);
  });

  it('logs the target number of working sets with numbered sets', () => {
    for (const session of history) {
      for (const day of days.filter((d) => d.programDayId === session.programDayId)) {
        for (const exercise of day.exercises) {
          const sets = session.sets.filter((s) => s.exerciseId === exercise.exerciseId);
          expect(sets.filter((s) => !s.isWarmup)).toHaveLength(exercise.targetSets);
          expect(sets.map((s) => s.setNumber)).toEqual(sets.map((_, i) => i + 1));
        }
      }
    }
  });

  it('gradually increases weights', () => {
    const bench = working(10);
    expect(bench[bench.length - 1]!.weightKg).toBeGreaterThan(bench[0]!.weightKg);
    const squat = working(20);
    expect(squat[squat.length - 1]!.weightKg - squat[0]!.weightKg).toBeGreaterThanOrEqual(5);
    for (let i = 1; i < bench.length; i++)
      expect(bench[i]!.weightKg).toBeGreaterThanOrEqual(bench[i - 1]!.weightKg);
  });

  it('includes weeks that hit the top of the range, weeks that miss the bottom, and warm-ups', () => {
    const benchBySession = history
      .map((s) => s.sets.filter((set) => set.exerciseId === 10 && !set.isWarmup))
      .filter((sets) => sets.length > 0);
    expect(benchBySession.some((sets) => sets.every((s) => s.reps >= 12))).toBe(true);
    const all = history.flatMap((s) => s.sets.filter((set) => !set.isWarmup));
    expect(
      all.some((s) =>
        s.exerciseId === 10 ? s.reps < 8 : s.exerciseId === 20 ? s.reps < 6 : false,
      ),
    ).toBe(true);
    expect(history.some((s) => s.sets.some((set) => set.isWarmup))).toBe(true);
  });

  it('keeps bodyweight exercises at 0 kg and is reproducible', () => {
    expect(working(21).every((s) => s.weightKg === 0)).toBe(true);
    expect(buildDemoHistory(days, { weeks: 8, now, seed: 7 })).toEqual(history);
  });

  it('has a deterministic PRNG in [0, 1)', () => {
    const a = mulberry32(1);
    const b = mulberry32(1);
    const values = Array.from({ length: 50 }, () => a());
    expect(values).toEqual(Array.from({ length: 50 }, () => b()));
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
  });
});

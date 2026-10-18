import { bestSet, computeVolume, sessionDurationMs, workingSets } from '@/utils/workoutStats';

const sets = [
  { weightKg: 20, reps: 15, isWarmup: true },
  { weightKg: 60, reps: 10, isWarmup: false },
  { weightKg: 62.5, reps: 8, isWarmup: false },
  { weightKg: 62.5, reps: 6, isWarmup: false },
];

describe('workout stats', () => {
  it('computes volume over working sets only', () => {
    expect(computeVolume(sets)).toBe(60 * 10 + 62.5 * 8 + 62.5 * 6);
    expect(computeVolume([])).toBe(0);
    expect(computeVolume([{ weightKg: 0.1, reps: 3, isWarmup: false }])).toBe(0.3);
  });

  it('counts working sets', () => {
    expect(workingSets(sets)).toHaveLength(3);
  });

  it('picks the heaviest set, then the one with more reps', () => {
    expect(bestSet(sets)).toEqual({ weightKg: 62.5, reps: 8, isWarmup: false });
    expect(bestSet([sets[0]!])).toBeNull();
  });

  it('measures duration', () => {
    expect(sessionDurationMs('2026-10-18T10:00:00.000Z', '2026-10-18T11:05:00.000Z')).toBe(
      65 * 60_000,
    );
    expect(sessionDurationMs('2026-10-18T10:00:00.000Z', null)).toBe(0);
  });
});

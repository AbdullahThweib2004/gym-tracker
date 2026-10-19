import {
  buildSessionPoints,
  chartBaseline,
  computeProgressStats,
  filterByRange,
} from '../progressSeries';

const set = (
  sessionId: number,
  date: string,
  weightKg: number,
  reps: number,
  isWarmup = false,
) => ({
  sessionId,
  date,
  weightKg,
  reps,
  isWarmup,
});

const sets = [
  set(3, '2026-10-10', 65, 8),
  set(3, '2026-10-10', 20, 15, true),
  set(1, '2026-07-01', 60, 10),
  set(1, '2026-07-01', 60, 8),
  set(2, '2026-09-20', 62.5, 10),
  set(4, '2026-10-15', 30, 10, true),
];

describe('buildSessionPoints', () => {
  it('builds one point per session with working sets, oldest first', () => {
    const points = buildSessionPoints(sets);
    expect(points.map((p) => [p.sessionId, p.bestWeight, p.volume])).toEqual([
      [1, 60, 1080],
      [2, 62.5, 625],
      [3, 65, 520],
    ]);
    expect(points[0]?.estimated1RM).toBe(80);
  });
});

describe('filterByRange', () => {
  const now = new Date(2026, 9, 18);
  const points = buildSessionPoints(sets);

  it('keeps points inside the range', () => {
    expect(filterByRange(points, '1M', now).map((p) => p.sessionId)).toEqual([2, 3]);
    // 3M starts on 18 Jul, so the 1 Jul session is out.
    expect(filterByRange(points, '3M', now).map((p) => p.sessionId)).toEqual([2, 3]);
    expect(filterByRange(points, '6M', now).map((p) => p.sessionId)).toEqual([1, 2, 3]);
    expect(filterByRange(points, 'all', now)).toHaveLength(3);
  });
});

describe('computeProgressStats', () => {
  const points = buildSessionPoints(sets);

  it('reports all-time bests and the change over the range', () => {
    expect(computeProgressStats(points, points.slice(1))).toEqual({
      heaviest: { weightKg: 65, date: '2026-10-10' },
      best1RM: 83.33, // 62.5 × 10
      totalSessions: 3,
      bestWeightChange: 2.5,
    });
  });

  it('has no change with fewer than two sessions in range', () => {
    expect(computeProgressStats(points, points.slice(2)).bestWeightChange).toBeNull();
    expect(computeProgressStats([], [])).toEqual({
      heaviest: null,
      best1RM: null,
      totalSessions: 0,
      bestWeightChange: null,
    });
  });
});

describe('chart helpers', () => {
  it('starts the axis below the data but not under 0', () => {
    expect(chartBaseline([60, 62.5, 65])).toBe(51);
    expect(chartBaseline([100, 100])).toBe(85);
    expect(chartBaseline([0, 5])).toBe(0);
    expect(chartBaseline([])).toBe(0);
  });
});

import { computeVolume, workingSets, type SetLike } from '@/utils/workoutStats';
import { parseIsoDate } from '@/utils/date';

import { estimate1RM } from './oneRepMax';

export type ProgressMetric = 'bestWeight' | 'estimated1RM' | 'volume';
export type ProgressRange = '1M' | '3M' | '6M' | 'all';

export type SessionPoint = {
  sessionId: number;
  /** YYYY-MM-DD */
  date: string;
  bestWeight: number;
  estimated1RM: number;
  volume: number;
};

type HistorySet = SetLike & { sessionId: number; date: string };

/** One point per session that has working sets, oldest first. */
export function buildSessionPoints(sets: readonly HistorySet[]): SessionPoint[] {
  const bySession = new Map<number, HistorySet[]>();
  for (const set of sets) {
    const list = bySession.get(set.sessionId) ?? [];
    list.push(set);
    bySession.set(set.sessionId, list);
  }
  const points: SessionPoint[] = [];
  for (const [sessionId, list] of bySession) {
    const working = workingSets(list);
    if (working.length === 0) continue;
    points.push({
      sessionId,
      date: list[0]!.date,
      bestWeight: Math.max(...working.map((s) => s.weightKg)),
      estimated1RM: Math.max(...working.map((s) => estimate1RM(s.weightKg, s.reps))),
      volume: computeVolume(working),
    });
  }
  return points.sort((a, b) => a.date.localeCompare(b.date) || a.sessionId - b.sessionId);
}

const RANGE_MONTHS: Record<Exclude<ProgressRange, 'all'>, number> = { '1M': 1, '3M': 3, '6M': 6 };

export function filterByRange(
  points: readonly SessionPoint[],
  range: ProgressRange,
  now: Date,
): SessionPoint[] {
  if (range === 'all') return [...points];
  const from = new Date(now.getFullYear(), now.getMonth() - RANGE_MONTHS[range], now.getDate());
  return points.filter((p) => parseIsoDate(p.date) >= from);
}

export type ProgressStats = {
  heaviest: { weightKg: number; date: string } | null;
  best1RM: number | null;
  totalSessions: number;
  /** Best weight of the last session in range minus the first one; null with < 2 sessions. */
  bestWeightChange: number | null;
};

/** Heaviest / best 1RM / session count are all-time; the change is over the given points. */
export function computeProgressStats(
  all: readonly SessionPoint[],
  inRange: readonly SessionPoint[],
): ProgressStats {
  let heaviest: ProgressStats['heaviest'] = null;
  for (const point of all) {
    if (!heaviest || point.bestWeight > heaviest.weightKg)
      heaviest = { weightKg: point.bestWeight, date: point.date };
  }
  const first = inRange[0];
  const last = inRange[inRange.length - 1];
  return {
    heaviest,
    best1RM: all.length ? Math.max(...all.map((p) => p.estimated1RM)) : null,
    totalSessions: all.length,
    bestWeightChange:
      first && last && inRange.length >= 2
        ? Number.parseFloat((last.bestWeight - first.bestWeight).toFixed(2))
        : null,
  };
}

/** Where the y-axis starts so changes are visible: ~15% below the lowest value, never < 0. */
export function chartBaseline(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max((max - min) * 0.5, min * 0.15);
  return Math.max(0, Math.floor(min - padding));
}

export function metricValue(point: SessionPoint, metric: ProgressMetric): number {
  return point[metric];
}

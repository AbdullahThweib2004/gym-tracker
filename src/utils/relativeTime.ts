import { parseIsoDate, toDate } from './date';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export type ElapsedTime =
  { unit: 'justNow' } | { unit: 'minutes' | 'hours' | 'days'; count: number };

/** Coarse elapsed time between `from` and `now` ("just now", "25 minutes", "3 hours", "2 days"). */
export function getElapsedTime(from: string | Date, now: Date = new Date()): ElapsedTime {
  const ms = Math.max(0, now.getTime() - toDate(from).getTime());
  if (ms < MINUTE) return { unit: 'justNow' };
  if (ms < HOUR) return { unit: 'minutes', count: Math.floor(ms / MINUTE) };
  if (ms < 24 * HOUR) return { unit: 'hours', count: Math.floor(ms / HOUR) };
  return { unit: 'days', count: Math.floor(ms / (24 * HOUR)) };
}

/** Whole calendar days between a YYYY-MM-DD date and today (0 = today, 1 = yesterday). */
export function calendarDaysAgo(isoDate: string, now: Date = new Date()): number {
  const then = parseIsoDate(isoDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Round to absorb DST shifts of ±1 hour.
  return Math.max(0, Math.round((today.getTime() - then.getTime()) / (24 * HOUR)));
}

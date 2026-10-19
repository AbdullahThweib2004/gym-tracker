import { parseIsoDate } from './date';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/** Whole calendar days between a YYYY-MM-DD date and today (0 = today, 1 = yesterday). */
export function calendarDaysAgo(isoDate: string, now: Date = new Date()): number {
  const then = parseIsoDate(isoDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Round to absorb DST shifts of ±1 hour.
  return Math.max(0, Math.round((today.getTime() - then.getTime()) / (24 * HOUR)));
}

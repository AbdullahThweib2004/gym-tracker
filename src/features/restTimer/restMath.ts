import { DEFAULT_REST_SECONDS } from '@/constants/settings';

export const REST_MIN_SECONDS = 30;
export const REST_MAX_SECONDS = 300;
export const REST_ADJUST_SECONDS = 15;

/** Exercise rest → default from settings → 90 s. Non-positive values count as "not set". */
export function resolveRestSeconds(
  exerciseRest: number | null | undefined,
  defaultRest: number | null | undefined,
): number {
  if (exerciseRest && exerciseRest > 0) return exerciseRest;
  if (defaultRest && defaultRest > 0) return defaultRest;
  return DEFAULT_REST_SECONDS;
}

export function remainingMs(endAt: number, now: number): number {
  return Math.max(0, endAt - now);
}

/** Fraction of the rest left, 1 → 0. */
export function remainingFraction(endAt: number, totalMs: number, now: number): number {
  if (totalMs <= 0) return 0;
  return Math.min(1, remainingMs(endAt, now) / totalMs);
}

/**
 * Moves the end by `deltaSeconds`, never into the past. The total grows with +15 s so the
 * progress bar stays meaningful.
 */
export function adjustTimer(
  timer: { endAt: number; totalMs: number },
  deltaSeconds: number,
  now: number,
): { endAt: number; totalMs: number } {
  const endAt = Math.max(now, timer.endAt + deltaSeconds * 1000);
  const totalMs = Math.max(timer.totalMs, endAt - now);
  return { endAt, totalMs };
}

/**
 * Per-exercise rest stepper: 0 means "default", and real values stay within 30–300 s, so
 * stepping up from 0 jumps to 30 and stepping down from 30 goes back to the default.
 * Returns null for "default".
 */
export function snapRestSeconds(previous: number, next: number): number | null {
  if (next <= 0) return null;
  if (next < REST_MIN_SECONDS) return previous === 0 ? REST_MIN_SECONDS : null;
  return Math.min(next, REST_MAX_SECONDS);
}

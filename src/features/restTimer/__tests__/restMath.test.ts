import {
  adjustTimer,
  remainingFraction,
  remainingMs,
  resolveRestSeconds,
  snapRestSeconds,
} from '../restMath';

describe('resolveRestSeconds', () => {
  it('prefers the exercise, then the default, then 90 s', () => {
    expect(resolveRestSeconds(120, 60)).toBe(120);
    expect(resolveRestSeconds(null, 60)).toBe(60);
    expect(resolveRestSeconds(0, null)).toBe(90);
    expect(resolveRestSeconds(undefined, undefined)).toBe(90);
  });
});

describe('remaining time', () => {
  it('is computed from the end timestamp, so backgrounding does not drift', () => {
    const endAt = 1_000_000 + 90_000;
    expect(remainingMs(endAt, 1_000_000)).toBe(90_000);
    // e.g. the phone was locked for a minute
    expect(remainingMs(endAt, 1_060_000)).toBe(30_000);
    expect(remainingMs(endAt, 2_000_000)).toBe(0);
    expect(remainingFraction(endAt, 90_000, 1_060_000)).toBeCloseTo(1 / 3);
    expect(remainingFraction(endAt, 0, 0)).toBe(0);
  });
});

describe('adjustTimer', () => {
  const now = 1_000_000;
  const timer = { endAt: now + 30_000, totalMs: 90_000 };

  it('adds and removes 15 s', () => {
    expect(adjustTimer(timer, 15, now)).toEqual({ endAt: now + 45_000, totalMs: 90_000 });
    expect(adjustTimer(timer, -15, now)).toEqual({ endAt: now + 15_000, totalMs: 90_000 });
  });

  it('never ends in the past and grows the total when needed', () => {
    expect(adjustTimer(timer, -60, now).endAt).toBe(now);
    expect(adjustTimer({ endAt: now + 85_000, totalMs: 90_000 }, 15, now)).toEqual({
      endAt: now + 100_000,
      totalMs: 100_000,
    });
  });
});

describe('snapRestSeconds', () => {
  it('jumps between "default" and the 30 s minimum', () => {
    expect(snapRestSeconds(0, 15)).toBe(30);
    expect(snapRestSeconds(30, 15)).toBeNull();
    expect(snapRestSeconds(45, 30)).toBe(30);
    expect(snapRestSeconds(90, 105)).toBe(105);
    expect(snapRestSeconds(300, 315)).toBe(300);
    expect(snapRestSeconds(30, 0)).toBeNull();
  });
});

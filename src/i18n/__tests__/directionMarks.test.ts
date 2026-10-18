import ar from '../locales/ar.json';
import en from '../locales/en.json';
import {
  formatClock,
  formatDuration,
  formatSet,
  formatSetCompact,
  formatSetsLine,
  formatTarget,
  formatVolume,
  formatWeight,
  ltr,
} from '../format';

const LRI = 0x2066;
const PDI = 0x2069;
// Escape *text* that would show up literally on screen, e.g. "‎" or "\x20".
const ESCAPE_TEXT = /\\(u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]+\}|x[0-9a-fA-F]{2}|n|t)/;

type Tree = { [key: string]: string | Tree };
const strings = (tree: Tree): string[] =>
  Object.values(tree).flatMap((value) => (typeof value === 'string' ? [value] : strings(value)));

describe('direction marks', () => {
  it('ltr() wraps text in real LRI/PDI characters', () => {
    const out = ltr('60 × 10');
    expect(out.charCodeAt(0)).toBe(LRI);
    expect(out.charCodeAt(out.length - 1)).toBe(PDI);
    expect(out).toHaveLength('60 × 10'.length + 2);
    expect(out).not.toMatch(ESCAPE_TEXT);
  });

  it('formatting helpers never produce escape text', () => {
    const outputs = (['en', 'ar'] as const).flatMap((lng) => [
      formatSet(62.5, 8, lng),
      formatWeight(62.5, lng),
      formatVolume(12450, lng),
      formatDuration(65 * 60_000, lng),
    ]);
    outputs.push(
      formatSetCompact(60, 10),
      formatSetsLine([
        { weightKg: 60, reps: 10 },
        { weightKg: 55, reps: 8 },
      ]),
      formatTarget(3, 8, 12),
      formatClock(83_000),
    );
    for (const text of outputs) expect(text).not.toMatch(ESCAPE_TEXT);
  });

  it('isolates each set so numbers keep their order in Arabic', () => {
    const line = formatSetsLine([
      { weightKg: 60, reps: 10 },
      { weightKg: 55, reps: 8 },
    ]);
    const isolates = [...line].filter((ch) => ch.charCodeAt(0) === LRI);
    expect(isolates).toHaveLength(2);
    expect(line.replace(/[⁦⁩]/g, '')).toBe('60 × 10 · 55 × 8');
    expect(formatTarget(3, 8, 12).replace(/[⁦⁩]/g, '')).toBe('3 × 8–12');
  });

  it('no locale string contains escape text', () => {
    for (const value of [...strings(en), ...strings(ar)]) expect(value).not.toMatch(ESCAPE_TEXT);
  });
});

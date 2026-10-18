import {
  clamp,
  formatNumber,
  normalizeNumericText,
  parseNumericInput,
  roundToStep,
  sanitizeNumericInput,
} from '../number';

describe('normalizeNumericText', () => {
  it('converts Arabic-Indic digits and separators', () => {
    expect(normalizeNumericText('٦٢٫٥')).toBe('62.5');
    expect(normalizeNumericText('۱۰')).toBe('10');
    expect(normalizeNumericText('62,5')).toBe('62.5');
  });
});

describe('sanitizeNumericInput', () => {
  it('keeps a single decimal separator when allowed', () => {
    expect(sanitizeNumericInput('62.5.1', true)).toBe('62.51');
    expect(sanitizeNumericInput('.5', true)).toBe('0.5');
  });

  it('strips decimals for integer inputs', () => {
    expect(sanitizeNumericInput('8.5', false)).toBe('85');
    expect(sanitizeNumericInput('1a2', false)).toBe('12');
  });
});

describe('parseNumericInput', () => {
  it('parses decimals and integers', () => {
    expect(parseNumericInput('62.5', true)).toBe(62.5);
    expect(parseNumericInput('62.', true)).toBe(62);
    expect(parseNumericInput('12', false)).toBe(12);
  });

  it('returns null for empty input', () => {
    expect(parseNumericInput('', true)).toBeNull();
    expect(parseNumericInput('abc', false)).toBeNull();
  });
});

describe('roundToStep', () => {
  it('rounds to the nearest step without float noise', () => {
    expect(roundToStep(61.3, 2.5)).toBe(62.5);
    expect(roundToStep(0.1 + 0.2, 0.5)).toBe(0.5);
    expect(roundToStep(7, 0)).toBe(7);
  });
});

describe('clamp and formatNumber', () => {
  it('clamps', () => {
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('drops trailing zeros', () => {
    expect(formatNumber(60)).toBe('60');
    expect(formatNumber(62.5)).toBe('62.5');
    expect(formatNumber(1.005, 1)).toBe('1');
  });
});

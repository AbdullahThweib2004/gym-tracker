import { dayLabel, exerciseName, formatDate, formatSet, formatWeight, splitLabel } from '../format';

const exercise = { nameEn: 'Barbell Bench Press', nameAr: 'بنش بريس بار' };

describe('format helpers', () => {
  it('picks the exercise name for the language', () => {
    expect(exerciseName(exercise, 'en')).toBe('Barbell Bench Press');
    expect(exerciseName(exercise, 'ar')).toBe('بنش بريس بار');
    expect(exerciseName({ nameEn: 'Custom', nameAr: '' }, 'ar')).toBe('Custom');
  });

  it('labels splits and days', () => {
    expect(splitLabel('ppl', 'en')).toBe('Push / Pull / Legs');
    expect(dayLabel('ppl', 'push', 'ar')).toBe('دفع');
    expect(dayLabel('ppl', 'unknown', 'en')).toBe('unknown');
  });

  it('formats weights with the localized unit', () => {
    expect(formatWeight(62.5, 'en')).toBe('62.5 kg');
    expect(formatWeight(62.5, 'ar')).toBe('62.5 كغ');
    expect(formatWeight(60, 'en')).toBe('60 kg');
    expect(formatSet(62.5, 8, 'en')).toBe('62.5 kg × 8');
  });

  it('formats dates in the given locale', () => {
    expect(formatDate('2026-10-18', 'medium', 'en')).toBe('Oct 18, 2026');
    expect(formatDate('2026-10-18', 'medium', 'ar')).toMatch(/2026/);
  });
});

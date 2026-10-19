import type { Language } from '@/constants/settings';
import { getSplit, getSplitDay, isSplitKey } from '@/constants/splits';
import type { Exercise } from '@/db/schema';
import { toDate } from '@/utils/date';
import { formatNumber } from '@/utils/number';

import i18n, { currentLanguage } from './index';

/** BCP-47 locale for Intl. Arabic uses Latin digits, which most Arab gym-goers prefer for numbers. */
function intlLocale(language: Language = currentLanguage()): string {
  return language === 'ar' ? 'ar-u-nu-latn' : 'en';
}

export function exerciseName(
  exercise: Pick<Exercise, 'nameEn' | 'nameAr'>,
  language: Language = currentLanguage(),
): string {
  if (language === 'ar') return exercise.nameAr || exercise.nameEn;
  return exercise.nameEn || exercise.nameAr;
}

export function splitLabel(splitKey: string, language: Language = currentLanguage()): string {
  if (!isSplitKey(splitKey)) return splitKey;
  const split = getSplit(splitKey);
  return language === 'ar' ? split.labelAr : split.labelEn;
}

export function dayLabel(
  splitKey: string,
  dayKey: string,
  language: Language = currentLanguage(),
): string {
  const day = getSplitDay(splitKey, dayKey);
  if (!day) return dayKey;
  return language === 'ar' ? day.labelAr : day.labelEn;
}

export type DateStyle = 'short' | 'medium' | 'long' | 'weekday' | 'weekdayNarrow';

const DATE_OPTIONS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  short: { day: 'numeric', month: 'short' },
  medium: { day: 'numeric', month: 'short', year: 'numeric' },
  long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  weekday: { weekday: 'short', day: 'numeric', month: 'short' },
  weekdayNarrow: { weekday: 'narrow' },
};

export function formatDate(
  value: string | Date,
  style: DateStyle = 'medium',
  language: Language = currentLanguage(),
): string {
  return new Intl.DateTimeFormat(intlLocale(language), DATE_OPTIONS[style]).format(toDate(value));
}

export function formatTime(value: string | Date, language: Language = currentLanguage()): string {
  return new Intl.DateTimeFormat(intlLocale(language), {
    hour: 'numeric',
    minute: '2-digit',
  }).format(toDate(value));
}

/** "62.5 kg" / "62.5 كغ" */
export function formatWeight(weightKg: number, language: Language = currentLanguage()): string {
  return i18n.t('common.units.weightValue', { value: formatNumber(weightKg), lng: language });
}

/** "62.5 kg × 8" / "62.5 كغ × 8" */
export function formatSet(
  weightKg: number,
  reps: number,
  language: Language = currentLanguage(),
): string {
  return i18n.t('common.units.setValue', {
    weight: formatWeight(weightKg, language),
    reps,
    lng: language,
  });
}

// Left-to-right isolate: keeps "60 × 10" and "8–12" in reading order inside Arabic text,
// where the bidi algorithm would otherwise reverse the numbers around "×" and "–".
// Built from code points so the source shows what they are and the UI gets the real characters.
const LRI = String.fromCharCode(0x2066);
const PDI = String.fromCharCode(0x2069);
export const ltr = (text: string) => `${LRI}${text}${PDI}`;

/** Compact set without units, e.g. "60 × 10" (for lists of sets). */
export function formatSetCompact(weightKg: number, reps: number): string {
  return ltr(`${formatNumber(weightKg)} × ${reps}`);
}

/** "60 × 10 · 60 × 8 · 55 × 10" */
export function formatSetsLine(sets: readonly { weightKg: number; reps: number }[]): string {
  return sets.map((set) => formatSetCompact(set.weightKg, set.reps)).join(' · ');
}

/** "3 × 8–12" (or "3 × 8" when min = max) */
export function formatTarget(targetSets: number, repsMin: number, repsMax: number): string {
  return ltr(
    repsMin === repsMax ? `${targetSets} × ${repsMin}` : `${targetSets} × ${repsMin}–${repsMax}`,
  );
}

/** Grouped number, e.g. "12,450" */
export function formatGroupedNumber(value: number, language: Language = currentLanguage()): string {
  return new Intl.NumberFormat(intlLocale(language), { maximumFractionDigits: 1 }).format(value);
}

/** "12,450 kg" / "12,450 كغ" */
export function formatVolume(volumeKg: number, language: Language = currentLanguage()): string {
  return i18n.t('common.units.weightValue', {
    value: formatGroupedNumber(volumeKg, language),
    lng: language,
  });
}

/** "1 h 05 min" / "45 min" */
export function formatDuration(ms: number, language: Language = currentLanguage()): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return i18n.t('common.duration.minutes', { m: minutes, lng: language });
  return i18n.t('common.duration.hoursMinutes', {
    h: hours,
    m: String(minutes).padStart(2, '0'),
    lng: language,
  });
}

/** Stopwatch style "12:34" or "1:02:03". */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** "Oct 5 – 11" style range for a week. */
export function formatDateRange(
  start: string,
  end: string,
  language: Language = currentLanguage(),
): string {
  return `${formatDate(start, 'short', language)} – ${formatDate(end, 'short', language)}`;
}

/** Rest duration as a clock, e.g. "1:30". */
export function formatRestSeconds(seconds: number): string {
  return ltr(formatClock(seconds * 1000));
}

/** "+7.5 kg" / "−2.5 kg" / "0 kg" with the sign kept next to the number in RTL. */
export function formatWeightChange(
  deltaKg: number,
  language: Language = currentLanguage(),
): string {
  const sign = deltaKg > 0 ? '+' : deltaKg < 0 ? '−' : '';
  return i18n.t('common.units.weightValue', {
    value: ltr(`${sign}${formatNumber(Math.abs(deltaKg))}`),
    lng: language,
  });
}

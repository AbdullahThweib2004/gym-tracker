import type { Language } from '@/constants/settings';
import { getSplit, getSplitDay, isSplitKey } from '@/constants/splits';
import type { Exercise } from '@/db/schema';
import { toDate } from '@/utils/date';
import { formatNumber } from '@/utils/number';

import i18n, { currentLanguage } from './index';

/** BCP-47 locale for Intl. Arabic uses Latin digits, which most Arab gym-goers prefer for numbers. */
export function intlLocale(language: Language = currentLanguage()): string {
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

export type DateStyle = 'short' | 'medium' | 'long' | 'weekday';

const DATE_OPTIONS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  short: { day: 'numeric', month: 'short' },
  medium: { day: 'numeric', month: 'short', year: 'numeric' },
  long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  weekday: { weekday: 'short', day: 'numeric', month: 'short' },
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

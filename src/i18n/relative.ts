import { calendarDaysAgo, getElapsedTime } from '@/utils/relativeTime';

import i18n from './index';

/** "just now" / "25 minutes ago" / "3 hours ago" / "2 days ago" */
export function formatTimeAgo(from: string | Date, now: Date = new Date()): string {
  const elapsed = getElapsedTime(from, now);
  switch (elapsed.unit) {
    case 'justNow':
      return i18n.t('common.time.justNow');
    case 'minutes':
      return i18n.t('common.time.minutesAgo', { count: elapsed.count });
    case 'hours':
      return i18n.t('common.time.hoursAgo', { count: elapsed.count });
    case 'days':
      return i18n.t('common.time.daysAgo', { count: elapsed.count });
  }
}

/** "today" / "yesterday" / "3 days ago" for a YYYY-MM-DD date. */
export function formatDaysAgo(isoDate: string, now: Date = new Date()): string {
  const days = calendarDaysAgo(isoDate, now);
  if (days === 0) return i18n.t('common.time.today');
  if (days === 1) return i18n.t('common.time.yesterday');
  return i18n.t('common.time.daysAgo', { count: days });
}

import { calendarDaysAgo } from '@/utils/relativeTime';

import i18n from './index';

/** "today" / "yesterday" / "3 days ago" for a YYYY-MM-DD date. */
export function formatDaysAgo(isoDate: string, now: Date = new Date()): string {
  const days = calendarDaysAgo(isoDate, now);
  if (days === 0) return i18n.t('common.time.today');
  if (days === 1) return i18n.t('common.time.yesterday');
  return i18n.t('common.time.daysAgo', { count: days });
}

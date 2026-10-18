import { parseIsoDate, toIsoDate } from '@/utils/date';

/** 0 = Sunday … 6 = Saturday */
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type WeekGroupKind = 'thisWeek' | 'lastWeek' | 'range';

export type WeekGroup<T> = {
  key: string;
  kind: WeekGroupKind;
  /** First and last day of the week, YYYY-MM-DD. */
  start: string;
  end: string;
  items: T[];
};

export function startOfWeek(date: Date, weekStartsOn: WeekStart): Date {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = (day.getDay() - weekStartsOn + 7) % 7;
  day.setDate(day.getDate() - diff);
  return day;
}

/**
 * Groups items by the week of their date (YYYY-MM-DD), newest week first, keeping each
 * group's items in the given order. The current and previous weeks are labelled specially.
 */
export function groupByWeek<T>(
  items: readonly T[],
  getDate: (item: T) => string,
  now: Date,
  weekStartsOn: WeekStart,
): WeekGroup<T>[] {
  const thisWeek = toIsoDate(startOfWeek(now, weekStartsOn));
  const lastWeekDate = startOfWeek(now, weekStartsOn);
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const lastWeek = toIsoDate(lastWeekDate);

  const groups = new Map<string, WeekGroup<T>>();
  for (const item of items) {
    const weekStart = startOfWeek(parseIsoDate(getDate(item)), weekStartsOn);
    const key = toIsoDate(weekStart);
    let group = groups.get(key);
    if (!group) {
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 6);
      group = {
        key,
        kind: key === thisWeek ? 'thisWeek' : key === lastWeek ? 'lastWeek' : 'range',
        start: key,
        end: toIsoDate(end),
        items: [],
      };
      groups.set(key, group);
    }
    group.items.push(item);
  }
  return [...groups.values()].sort((a, b) => b.start.localeCompare(a.start));
}

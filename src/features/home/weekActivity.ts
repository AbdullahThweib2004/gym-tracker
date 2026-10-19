import { startOfWeek, type WeekStart } from '@/features/history/weekGroups';
import { toIsoDate } from '@/utils/date';

export type WeekDayActivity = {
  date: string;
  isToday: boolean;
  isFuture: boolean;
  trained: boolean;
};

/** The 7 days of the current week with whether a workout was finished on each. */
export function weekActivity(
  finishedDates: readonly string[],
  now: Date,
  weekStartsOn: WeekStart,
): WeekDayActivity[] {
  const trained = new Set(finishedDates);
  const today = toIsoDate(now);
  const start = startOfWeek(now, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const date = toIsoDate(day);
    return { date, isToday: date === today, isFuture: date > today, trained: trained.has(date) };
  });
}

/** Workouts this week (one per training day counts) versus the program's days per week. */
export function weekProgress(
  days: readonly WeekDayActivity[],
  programDays: number,
): { done: number; goal: number } {
  return { done: days.filter((d) => d.trained).length, goal: programDays };
}

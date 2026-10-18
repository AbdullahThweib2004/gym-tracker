type DayRef = { id: number };

/**
 * The day to suggest next: the one after the most recently finished session's day in program
 * order, wrapping around. Falls back to the first day when there is no finished session or it
 * belongs to a day that is not part of this program.
 */
export function suggestNextDayId(
  orderedDays: readonly DayRef[],
  lastFinishedProgramDayId: number | null | undefined,
): number | null {
  if (orderedDays.length === 0) return null;
  const first = orderedDays[0]?.id ?? null;
  if (lastFinishedProgramDayId === null || lastFinishedProgramDayId === undefined) return first;
  const index = orderedDays.findIndex((day) => day.id === lastFinishedProgramDayId);
  if (index === -1) return first;
  return orderedDays[(index + 1) % orderedDays.length]?.id ?? first;
}

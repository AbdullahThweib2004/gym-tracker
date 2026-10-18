import { MUSCLE_GROUPS, type Equipment, type MuscleGroup } from '@/constants/muscles';
import type { Exercise } from '@/db/schema';
import { matchesSearch } from '@/utils/search';

export type MuscleSection = {
  muscleGroup: MuscleGroup;
  exercises: Exercise[];
};

export type PickerSections = {
  suggested: MuscleSection[];
  other: MuscleSection[];
};

export type PickerFilter = {
  query: string;
  equipment: readonly Equipment[];
};

/**
 * Filters exercises by search and equipment and groups them by muscle group. The day's
 * suggested groups come first (in the split's order), the rest follow in canonical order.
 * Empty groups are dropped.
 */
export function buildPickerSections(
  exercises: readonly Exercise[],
  suggestedGroups: readonly MuscleGroup[],
  filter: PickerFilter,
  displayName: (exercise: Exercise) => string,
): PickerSections {
  const visible = exercises.filter(
    (exercise) =>
      (filter.equipment.length === 0 || filter.equipment.includes(exercise.equipment)) &&
      matchesSearch(filter.query, [exercise.nameEn, exercise.nameAr]),
  );

  const byGroup = new Map<MuscleGroup, Exercise[]>();
  for (const exercise of visible) {
    const list = byGroup.get(exercise.muscleGroup) ?? [];
    list.push(exercise);
    byGroup.set(exercise.muscleGroup, list);
  }

  const toSection = (muscleGroup: MuscleGroup): MuscleSection | null => {
    const list = byGroup.get(muscleGroup);
    if (!list?.length) return null;
    return {
      muscleGroup,
      exercises: [...list].sort((a, b) => displayName(a).localeCompare(displayName(b))),
    };
  };

  const suggestedSet = new Set(suggestedGroups);
  const suggested = suggestedGroups.map(toSection).filter((s): s is MuscleSection => s !== null);
  const other = MUSCLE_GROUPS.filter((group) => !suggestedSet.has(group))
    .map(toSection)
    .filter((s): s is MuscleSection => s !== null);

  return { suggested, other };
}

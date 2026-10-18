export type ExerciseNamesInput = { nameEn: string; nameAr: string };

/**
 * At least one name is required; the missing one falls back to the other so the exercise
 * always has a name in both languages. Returns null when both are empty.
 */
export function normalizeExerciseNames(input: ExerciseNamesInput): ExerciseNamesInput | null {
  const nameEn = input.nameEn.trim().replace(/\s+/g, ' ');
  const nameAr = input.nameAr.trim().replace(/\s+/g, ' ');
  if (!nameEn && !nameAr) return null;
  return { nameEn: nameEn || nameAr, nameAr: nameAr || nameEn };
}

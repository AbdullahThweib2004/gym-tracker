export type ExerciseImage =
  | { kind: 'photo'; uri: string }
  | { kind: 'bundled'; start: number; end: number }
  | { kind: 'icon' };

/**
 * Which image to show: the user's own photo first, then the bundled start/end images for a
 * built-in exercise, otherwise the muscle-group icon.
 */
export function pickExerciseImage(
  photoUri: string | null,
  bundled: readonly [number, number] | undefined,
): ExerciseImage {
  if (photoUri) return { kind: 'photo', uri: photoUri };
  if (bundled) return { kind: 'bundled', start: bundled[0], end: bundled[1] };
  return { kind: 'icon' };
}

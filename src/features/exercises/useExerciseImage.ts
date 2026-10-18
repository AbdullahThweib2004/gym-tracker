import { EXERCISE_IMAGES } from '@/constants/exerciseImages';
import type { Exercise } from '@/db/schema';

import { pickExerciseImage, type ExerciseImage } from './exerciseImage';
import { resolvePhotoUri } from './photoStorage';

export type ExerciseImageInput = Pick<Exercise, 'muscleGroup' | 'imageUri' | 'key'>;

export function exerciseImageFor(exercise: ExerciseImageInput): ExerciseImage {
  return pickExerciseImage(
    resolvePhotoUri(exercise.imageUri),
    exercise.key ? EXERCISE_IMAGES[exercise.key] : undefined,
  );
}

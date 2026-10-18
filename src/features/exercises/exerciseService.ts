import type { Equipment, MuscleGroup } from '@/constants/muscles';
import {
  createExercise,
  deleteCustomExercise,
  getExerciseById,
  setExerciseArchived,
  updateExercise,
} from '@/db/repositories/exercises';
import type { Exercise } from '@/db/schema';

import { normalizeExerciseNames } from './exerciseNames';
import { deletePhoto, storePhoto } from './photoStorage';

export type ExerciseFormInput = {
  nameEn: string;
  nameAr: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
};

export type SaveResult =
  { ok: true; exercise: Exercise } | { ok: false; reason: 'nameRequired' | 'notFound' };

export function createCustomExercise(
  input: ExerciseFormInput,
  tempPhotoUri?: string | null,
): SaveResult {
  const names = normalizeExerciseNames(input);
  if (!names) return { ok: false, reason: 'nameRequired' };
  const exercise = createExercise({
    ...names,
    muscleGroup: input.muscleGroup,
    equipment: input.equipment,
  });
  if (!tempPhotoUri) return { ok: true, exercise };
  return { ok: true, exercise: setExercisePhoto(exercise.id, tempPhotoUri) ?? exercise };
}

/** Updates a custom exercise's names, muscle group and equipment (built-ins keep theirs). */
export function updateCustomExercise(id: number, input: ExerciseFormInput): SaveResult {
  const current = getExerciseById(id);
  if (!current) return { ok: false, reason: 'notFound' };
  if (!current.isCustom) return { ok: true, exercise: current };
  const names = normalizeExerciseNames(input);
  if (!names) return { ok: false, reason: 'nameRequired' };
  const exercise = updateExercise(id, {
    ...names,
    muscleGroup: input.muscleGroup,
    equipment: input.equipment,
  });
  return exercise ? { ok: true, exercise } : { ok: false, reason: 'notFound' };
}

/**
 * Sets the photo of any exercise (built-in ones too): copies the picked image into app
 * storage, saves its path, then deletes the previous photo file.
 */
export function setExercisePhoto(id: number, tempPhotoUri: string): Exercise | undefined {
  const current = getExerciseById(id);
  if (!current) return undefined;
  const stored = storePhoto(tempPhotoUri, id);
  const updated = updateExercise(id, { imageUri: stored });
  if (current.imageUri && current.imageUri !== stored) deletePhoto(current.imageUri);
  return updated;
}

export function removeExercisePhoto(id: number): Exercise | undefined {
  const current = getExerciseById(id);
  if (!current?.imageUri) return current;
  const updated = updateExercise(id, { imageUri: null });
  deletePhoto(current.imageUri);
  return updated;
}

/** Deletes an unused custom exercise and its photo; otherwise reports why it can't. */
export function deleteExercise(id: number): 'deleted' | 'inUse' | 'notCustom' {
  const current = getExerciseById(id);
  const result = deleteCustomExercise(id);
  if (result === 'deleted') deletePhoto(current?.imageUri);
  return result;
}

export function archiveExercise(id: number, isArchived: boolean): void {
  setExerciseArchived(id, isArchived);
}

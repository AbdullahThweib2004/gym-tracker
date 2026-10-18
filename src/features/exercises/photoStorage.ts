import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

/** Photos live in the app's document directory; the DB stores the path relative to it. */
const PHOTO_DIR = 'exercise-photos';

/**
 * File URI for a stored photo path. Relative paths are resolved against the document
 * directory at runtime because its absolute location can change (e.g. iOS app updates).
 */
export function resolvePhotoUri(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (/^(file|https?|blob|data):/.test(stored)) return stored;
  return new File(Paths.document, stored).uri;
}

/** Copies a picked (temporary) image into app storage and returns its relative path. */
export function storePhoto(tempUri: string, exerciseId: number): string {
  if (Platform.OS === 'web') return tempUri;
  const dir = new Directory(Paths.document, PHOTO_DIR);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  const name = `exercise-${exerciseId}-${Date.now()}.jpg`;
  new File(tempUri).copySync(new File(dir, name));
  return `${PHOTO_DIR}/${name}`;
}

/** Deletes a stored photo; missing files are ignored. */
export function deletePhoto(stored: string | null | undefined): void {
  if (!stored || Platform.OS === 'web' || /^(https?|blob|data):/.test(stored)) return;
  try {
    const file = /^file:/.test(stored) ? new File(stored) : new File(Paths.document, stored);
    if (file.exists) file.delete();
  } catch (error) {
    console.warn('Could not delete photo', error);
  }
}

export type PhotoSource = 'camera' | 'library';

/**
 * Lets the user take or choose a photo, cropped to a square. Returns the temporary URI, or
 * null if cancelled / permission denied (`denied` tells which).
 */
export async function pickSquarePhoto(
  source: PhotoSource,
): Promise<{ uri: string | null; denied: boolean }> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { uri: null, denied: true };

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return { uri: null, denied: false };
  return { uri: result.assets[0]?.uri ?? null, denied: false };
}

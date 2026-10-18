import { EXERCISE_IMAGES } from '@/constants/exerciseImages';
import { SEED_EXERCISES } from '@/db/seedData';

import mapping from '../../../../scripts/exercise-images/mapping.json';
import { pickExerciseImage } from '../exerciseImage';

describe('pickExerciseImage', () => {
  it('prefers the user photo, then the bundled image, then the icon', () => {
    expect(pickExerciseImage('file:///photo.jpg', [1, 2])).toEqual({
      kind: 'photo',
      uri: 'file:///photo.jpg',
    });
    expect(pickExerciseImage(null, [1, 2])).toEqual({ kind: 'bundled', start: 1, end: 2 });
    expect(pickExerciseImage(null, undefined)).toEqual({ kind: 'icon' });
  });
});

describe('bundled exercise images', () => {
  const seedKeys = SEED_EXERCISES.map((e) => e.key);
  const entries = mapping as Record<string, { datasetId: string | null }>;

  it('gives every built-in exercise a unique key', () => {
    expect(new Set(seedKeys).size).toBe(seedKeys.length);
    expect(seedKeys).toContain('farmers-walk');
    expect(seedKeys).toContain('t-bar-row');
  });

  it('maps exactly the seeded exercises', () => {
    expect(Object.keys(entries).sort()).toEqual([...seedKeys].sort());
  });

  it('has generated images for every matched exercise and nothing else', () => {
    const matched = Object.entries(entries)
      .filter(([, v]) => v.datasetId)
      .map(([k]) => k)
      .sort();
    expect(Object.keys(EXERCISE_IMAGES).sort()).toEqual(matched);
  });
});

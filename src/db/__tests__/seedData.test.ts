import { EQUIPMENT, MUSCLE_GROUPS } from '@/constants/muscles';

import { SEED_EXERCISES } from '../seedData';

const ARABIC = /[؀-ۿ]/;

describe('seed exercises', () => {
  it('has roughly 80+ exercises', () => {
    expect(SEED_EXERCISES.length).toBeGreaterThanOrEqual(80);
  });

  it('has unique English and Arabic names', () => {
    const en = SEED_EXERCISES.map((e) => e.nameEn.toLowerCase());
    const ar = SEED_EXERCISES.map((e) => e.nameAr);
    expect(new Set(en).size).toBe(en.length);
    expect(new Set(ar).size).toBe(ar.length);
  });

  it('uses valid enums and Arabic script for Arabic names', () => {
    for (const exercise of SEED_EXERCISES) {
      expect(MUSCLE_GROUPS).toContain(exercise.muscleGroup);
      expect(EQUIPMENT).toContain(exercise.equipment);
      expect(exercise.nameAr).toMatch(ARABIC);
    }
  });

  it.each(MUSCLE_GROUPS)('covers %s with barbell, dumbbell, machine and cable', (group) => {
    const equipment = new Set(
      SEED_EXERCISES.filter((e) => e.muscleGroup === group).map((e) => e.equipment),
    );
    for (const kind of ['barbell', 'dumbbell', 'machine', 'cable'] as const) {
      expect(equipment).toContain(kind);
    }
  });
});

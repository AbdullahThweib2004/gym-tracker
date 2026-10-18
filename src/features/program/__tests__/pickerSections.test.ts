import type { Exercise } from '@/db/schema';

import { buildPickerSections } from '../pickerSections';

let nextId = 1;
const ex = (
  nameEn: string,
  nameAr: string,
  muscleGroup: Exercise['muscleGroup'],
  equipment: Exercise['equipment'],
): Exercise => ({
  id: nextId++,
  nameEn,
  nameAr,
  muscleGroup,
  equipment,
  imageUri: null,
  isCustom: false,
  isArchived: false,
  createdAt: '2026-01-01T00:00:00.000Z',
});

const exercises = [
  ex('Dumbbell Fly', 'تفتيح دمبل', 'chest', 'dumbbell'),
  ex('Barbell Bench Press', 'بنش بريس بار', 'chest', 'barbell'),
  ex('Cable Pushdown', 'ترايسبس كيبل', 'triceps', 'cable'),
  ex('Back Squat', 'سكوات', 'legs', 'barbell'),
  ex('Barbell Curl', 'بايسبس بار', 'biceps', 'barbell'),
];
const byEnglish = (e: Exercise) => e.nameEn;

describe('buildPickerSections', () => {
  it('puts suggested groups first in split order and the rest in canonical order', () => {
    const { suggested, other } = buildPickerSections(
      exercises,
      ['triceps', 'chest'],
      { query: '', equipment: [] },
      byEnglish,
    );
    expect(suggested.map((s) => s.muscleGroup)).toEqual(['triceps', 'chest']);
    expect(other.map((s) => s.muscleGroup)).toEqual(['biceps', 'legs']);
  });

  it('sorts exercises by display name', () => {
    const { suggested } = buildPickerSections(
      exercises,
      ['chest'],
      { query: '', equipment: [] },
      byEnglish,
    );
    expect(suggested[0]?.exercises.map((e) => e.nameEn)).toEqual([
      'Barbell Bench Press',
      'Dumbbell Fly',
    ]);
  });

  it('filters by search (either language) and equipment, dropping empty groups', () => {
    const search = buildPickerSections(
      exercises,
      ['chest'],
      { query: 'بار', equipment: [] },
      byEnglish,
    );
    expect(search.suggested.map((s) => s.exercises.map((e) => e.nameEn))).toEqual([
      ['Barbell Bench Press'],
    ]);
    expect(search.other.map((s) => s.muscleGroup)).toEqual(['biceps']);

    const cable = buildPickerSections(
      exercises,
      ['chest'],
      { query: '', equipment: ['cable'] },
      byEnglish,
    );
    expect(cable.suggested).toEqual([]);
    expect(cable.other.map((s) => s.muscleGroup)).toEqual(['triceps']);
  });
});

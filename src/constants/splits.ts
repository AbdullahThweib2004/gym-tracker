import { MUSCLE_GROUPS, type MuscleGroup } from './muscles';

export type SplitDay = {
  key: string;
  labelEn: string;
  labelAr: string;
  suggestedMuscleGroups: readonly MuscleGroup[];
};

export type Split = {
  key: SplitKey;
  labelEn: string;
  labelAr: string;
  days: readonly SplitDay[];
};

export const SPLIT_KEYS = ['ppl', 'upper_lower', 'bro_split', 'full_body', 'ppl_upper'] as const;
export type SplitKey = (typeof SPLIT_KEYS)[number];

const push: SplitDay = {
  key: 'push',
  labelEn: 'Push',
  labelAr: 'دفع',
  suggestedMuscleGroups: ['chest', 'shoulders', 'triceps'],
};
const pull: SplitDay = {
  key: 'pull',
  labelEn: 'Pull',
  labelAr: 'سحب',
  suggestedMuscleGroups: ['back', 'biceps', 'forearms'],
};
const legs: SplitDay = {
  key: 'legs',
  labelEn: 'Legs',
  labelAr: 'أرجل',
  suggestedMuscleGroups: ['legs', 'glutes', 'calves', 'abs'],
};

const UPPER: readonly MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
];
const LOWER: readonly MuscleGroup[] = ['legs', 'glutes', 'calves', 'abs'];

export const SPLITS: Record<SplitKey, Split> = {
  ppl: {
    key: 'ppl',
    labelEn: 'Push / Pull / Legs',
    labelAr: 'دفع / سحب / أرجل',
    days: [push, pull, legs],
  },
  upper_lower: {
    key: 'upper_lower',
    labelEn: 'Upper / Lower',
    labelAr: 'علوي / سفلي',
    days: [
      { key: 'upperA', labelEn: 'Upper A', labelAr: 'علوي أ', suggestedMuscleGroups: UPPER },
      { key: 'lowerA', labelEn: 'Lower A', labelAr: 'سفلي أ', suggestedMuscleGroups: LOWER },
      { key: 'upperB', labelEn: 'Upper B', labelAr: 'علوي ب', suggestedMuscleGroups: UPPER },
      { key: 'lowerB', labelEn: 'Lower B', labelAr: 'سفلي ب', suggestedMuscleGroups: LOWER },
    ],
  },
  bro_split: {
    key: 'bro_split',
    labelEn: 'Big + Small Muscle',
    labelAr: 'عضلة كبيرة + صغيرة',
    days: [
      {
        key: 'chestTriceps',
        labelEn: 'Chest & Triceps',
        labelAr: 'صدر وترايسبس',
        suggestedMuscleGroups: ['chest', 'triceps'],
      },
      {
        key: 'backBiceps',
        labelEn: 'Back & Biceps',
        labelAr: 'ظهر وبايسبس',
        suggestedMuscleGroups: ['back', 'biceps', 'forearms'],
      },
      {
        key: 'legsShoulders',
        labelEn: 'Legs & Shoulders',
        labelAr: 'أرجل وأكتاف',
        suggestedMuscleGroups: ['legs', 'glutes', 'calves', 'shoulders', 'abs'],
      },
    ],
  },
  full_body: {
    key: 'full_body',
    labelEn: 'Full Body',
    labelAr: 'جسم كامل',
    days: [
      {
        key: 'fullA',
        labelEn: 'Full Body A',
        labelAr: 'جسم كامل أ',
        suggestedMuscleGroups: MUSCLE_GROUPS,
      },
      {
        key: 'fullB',
        labelEn: 'Full Body B',
        labelAr: 'جسم كامل ب',
        suggestedMuscleGroups: MUSCLE_GROUPS,
      },
      {
        key: 'fullC',
        labelEn: 'Full Body C',
        labelAr: 'جسم كامل ج',
        suggestedMuscleGroups: MUSCLE_GROUPS,
      },
    ],
  },
  ppl_upper: {
    key: 'ppl_upper',
    labelEn: 'PPL + Upper',
    labelAr: 'دفع / سحب / أرجل + علوي',
    days: [
      push,
      pull,
      legs,
      { key: 'upper', labelEn: 'Upper', labelAr: 'علوي', suggestedMuscleGroups: UPPER },
    ],
  },
};

export function isSplitKey(value: string): value is SplitKey {
  return (SPLIT_KEYS as readonly string[]).includes(value);
}

export function getSplit(key: SplitKey): Split {
  return SPLITS[key];
}

export function getSplitDay(splitKey: string, dayKey: string): SplitDay | undefined {
  if (!isSplitKey(splitKey)) return undefined;
  return SPLITS[splitKey].days.find((day) => day.key === dayKey);
}

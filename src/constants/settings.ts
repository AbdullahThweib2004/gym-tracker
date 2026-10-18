export const LANGUAGES = ['en', 'ar'] as const;
export type Language = (typeof LANGUAGES)[number];
export const RTL_LANGUAGES: readonly Language[] = ['ar'];

export const DEFAULT_REST_SECONDS = 90;

export const WEIGHT_STEP_KG = 2.5;
export const WEIGHT_FINE_STEP_KG = 0.5;
export const MAX_WEIGHT_KG = 1000;
export const MAX_REPS = 999;

export const DEFAULT_TARGET_SETS = 3;
export const DEFAULT_TARGET_REPS_MIN = 8;
export const DEFAULT_TARGET_REPS_MAX = 12;

export const TARGET_SETS_MIN = 1;
export const TARGET_SETS_MAX = 10;
export const TARGET_REPS_MIN = 1;
export const TARGET_REPS_MAX = 50;

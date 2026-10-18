import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { EQUIPMENT, MUSCLE_GROUPS } from '@/constants/muscles';
import {
  DEFAULT_TARGET_REPS_MAX,
  DEFAULT_TARGET_REPS_MIN,
  DEFAULT_TARGET_SETS,
} from '@/constants/settings';

const nowIso = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

export const appMeta = sqliteTable('app_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const exercises = sqliteTable(
  'exercises',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    nameEn: text('name_en').notNull(),
    nameAr: text('name_ar').notNull(),
    muscleGroup: text('muscle_group', { enum: MUSCLE_GROUPS }).notNull(),
    equipment: text('equipment', { enum: EQUIPMENT }).notNull(),
    imageUri: text('image_uri'),
    isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
    isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
    createdAt: text('created_at').notNull().default(nowIso),
  },
  (t) => [index('exercises_muscle_group_idx').on(t.muscleGroup)],
);

export const userPrograms = sqliteTable(
  'user_programs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    splitType: text('split_type').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
    createdAt: text('created_at').notNull().default(nowIso),
  },
  // Enforces "only one active program" at the database level.
  (t) => [
    uniqueIndex('user_programs_single_active_idx')
      .on(t.isActive)
      .where(sql`${t.isActive} = 1`),
  ],
);

export const programDays = sqliteTable(
  'program_days',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userProgramId: integer('user_program_id')
      .notNull()
      .references(() => userPrograms.id, { onDelete: 'cascade' }),
    dayKey: text('day_key').notNull(),
    orderIndex: integer('order_index').notNull(),
  },
  (t) => [index('program_days_program_idx').on(t.userProgramId)],
);

export const programDayExercises = sqliteTable(
  'program_day_exercises',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    programDayId: integer('program_day_id')
      .notNull()
      .references(() => programDays.id, { onDelete: 'cascade' }),
    exerciseId: integer('exercise_id')
      .notNull()
      .references(() => exercises.id),
    orderIndex: integer('order_index').notNull(),
    targetSets: integer('target_sets').notNull().default(DEFAULT_TARGET_SETS),
    targetRepsMin: integer('target_reps_min').notNull().default(DEFAULT_TARGET_REPS_MIN),
    targetRepsMax: integer('target_reps_max').notNull().default(DEFAULT_TARGET_REPS_MAX),
    restSeconds: integer('rest_seconds'),
  },
  (t) => [index('program_day_exercises_day_idx').on(t.programDayId)],
);

export const workoutSessions = sqliteTable(
  'workout_sessions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userProgramId: integer('user_program_id').references(() => userPrograms.id, {
      onDelete: 'set null',
    }),
    programDayId: integer('program_day_id').references(() => programDays.id, {
      onDelete: 'set null',
    }),
    dayKey: text('day_key').notNull(),
    /** Local calendar date, YYYY-MM-DD. */
    date: text('date').notNull(),
    startedAt: text('started_at').notNull(),
    finishedAt: text('finished_at'),
    notes: text('notes'),
  },
  (t) => [
    index('workout_sessions_date_idx').on(t.date),
    index('workout_sessions_finished_at_idx').on(t.finishedAt),
  ],
);

export const sessionSets = sqliteTable(
  'session_sets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    sessionId: integer('session_id')
      .notNull()
      .references(() => workoutSessions.id, { onDelete: 'cascade' }),
    exerciseId: integer('exercise_id')
      .notNull()
      .references(() => exercises.id),
    setNumber: integer('set_number').notNull(),
    weightKg: real('weight_kg').notNull(),
    reps: integer('reps').notNull(),
    isWarmup: integer('is_warmup', { mode: 'boolean' }).notNull().default(false),
    createdAt: text('created_at').notNull().default(nowIso),
  },
  (t) => [
    index('session_sets_exercise_created_idx').on(t.exerciseId, t.createdAt),
    index('session_sets_session_idx').on(t.sessionId),
  ],
);

export type AppMetaRow = typeof appMeta.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
export type UserProgram = typeof userPrograms.$inferSelect;
export type NewUserProgram = typeof userPrograms.$inferInsert;
export type ProgramDay = typeof programDays.$inferSelect;
export type NewProgramDay = typeof programDays.$inferInsert;
export type ProgramDayExercise = typeof programDayExercises.$inferSelect;
export type NewProgramDayExercise = typeof programDayExercises.$inferInsert;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type NewWorkoutSession = typeof workoutSessions.$inferInsert;
export type SessionSet = typeof sessionSets.$inferSelect;
export type NewSessionSet = typeof sessionSets.$inferInsert;

CREATE TABLE `app_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name_en` text NOT NULL,
	`name_ar` text NOT NULL,
	`muscle_group` text NOT NULL,
	`equipment` text NOT NULL,
	`image_uri` text,
	`is_custom` integer DEFAULT false NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `exercises_muscle_group_idx` ON `exercises` (`muscle_group`);--> statement-breakpoint
CREATE TABLE `program_day_exercises` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`program_day_id` integer NOT NULL,
	`exercise_id` integer NOT NULL,
	`order_index` integer NOT NULL,
	`target_sets` integer DEFAULT 3 NOT NULL,
	`target_reps_min` integer DEFAULT 8 NOT NULL,
	`target_reps_max` integer DEFAULT 12 NOT NULL,
	`rest_seconds` integer,
	FOREIGN KEY (`program_day_id`) REFERENCES `program_days`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `program_day_exercises_day_idx` ON `program_day_exercises` (`program_day_id`);--> statement-breakpoint
CREATE TABLE `program_days` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_program_id` integer NOT NULL,
	`day_key` text NOT NULL,
	`order_index` integer NOT NULL,
	FOREIGN KEY (`user_program_id`) REFERENCES `user_programs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `program_days_program_idx` ON `program_days` (`user_program_id`);--> statement-breakpoint
CREATE TABLE `session_sets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`exercise_id` integer NOT NULL,
	`set_number` integer NOT NULL,
	`weight_kg` real NOT NULL,
	`reps` integer NOT NULL,
	`is_warmup` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `workout_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `session_sets_exercise_created_idx` ON `session_sets` (`exercise_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `session_sets_session_idx` ON `session_sets` (`session_id`);--> statement-breakpoint
CREATE TABLE `user_programs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`split_type` text NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_programs_single_active_idx` ON `user_programs` (`is_active`) WHERE "user_programs"."is_active" = 1;--> statement-breakpoint
CREATE TABLE `workout_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_program_id` integer,
	`program_day_id` integer,
	`day_key` text NOT NULL,
	`date` text NOT NULL,
	`started_at` text NOT NULL,
	`finished_at` text,
	`notes` text,
	FOREIGN KEY (`user_program_id`) REFERENCES `user_programs`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`program_day_id`) REFERENCES `program_days`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `workout_sessions_date_idx` ON `workout_sessions` (`date`);--> statement-breakpoint
CREATE INDEX `workout_sessions_finished_at_idx` ON `workout_sessions` (`finished_at`);
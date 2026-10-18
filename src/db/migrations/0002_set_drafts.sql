CREATE TABLE `set_drafts` (
	`session_id` integer NOT NULL,
	`exercise_id` integer NOT NULL,
	`rows_json` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`session_id`, `exercise_id`),
	FOREIGN KEY (`session_id`) REFERENCES `workout_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);

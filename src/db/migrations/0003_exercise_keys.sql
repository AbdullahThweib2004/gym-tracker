ALTER TABLE `exercises` ADD `key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `exercises_key_idx` ON `exercises` (`key`);
--> statement-breakpoint
-- Backfill stable keys for the built-in exercises (matched by their English name; custom exercises keep NULL).
UPDATE `exercises` SET `key` = 'barbell-bench-press' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Barbell Bench Press';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'incline-barbell-bench-press' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Incline Barbell Bench Press';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'decline-barbell-bench-press' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Decline Barbell Bench Press';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'dumbbell-bench-press' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Dumbbell Bench Press';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'incline-dumbbell-press' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Incline Dumbbell Press';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'dumbbell-fly' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Dumbbell Fly';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'machine-chest-press' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Machine Chest Press';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'pec-deck-fly' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Pec Deck Fly';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'cable-crossover' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Cable Crossover';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'low-to-high-cable-fly' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Low-to-High Cable Fly';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'push-up' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Push-Up';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'chest-dip' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Chest Dip';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'deadlift' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Deadlift';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'barbell-row' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Barbell Row';--> statement-breakpoint
UPDATE `exercises` SET `key` = 't-bar-row' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'T-Bar Row';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'one-arm-dumbbell-row' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'One-Arm Dumbbell Row';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'dumbbell-pullover' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Dumbbell Pullover';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'lat-pulldown' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Lat Pulldown';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'close-grip-lat-pulldown' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Close-Grip Lat Pulldown';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'seated-cable-row' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Seated Cable Row';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'straight-arm-pulldown' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Straight-Arm Pulldown';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'machine-row' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Machine Row';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'back-extension' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Back Extension';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'pull-up' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Pull-Up';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'overhead-barbell-press' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Overhead Barbell Press';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'barbell-upright-row' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Barbell Upright Row';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'seated-dumbbell-shoulder-press' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Seated Dumbbell Shoulder Press';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'arnold-press' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Arnold Press';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'dumbbell-lateral-raise' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Dumbbell Lateral Raise';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'dumbbell-front-raise' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Dumbbell Front Raise';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'rear-delt-dumbbell-fly' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Rear Delt Dumbbell Fly';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'dumbbell-shrug' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Dumbbell Shrug';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'machine-shoulder-press' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Machine Shoulder Press';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'reverse-pec-deck' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Reverse Pec Deck';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'cable-lateral-raise' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Cable Lateral Raise';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'face-pull' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Face Pull';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'barbell-curl' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Barbell Curl';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'ez-bar-curl' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'EZ-Bar Curl';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'dumbbell-curl' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Dumbbell Curl';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'hammer-curl' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Hammer Curl';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'incline-dumbbell-curl' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Incline Dumbbell Curl';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'concentration-curl' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Concentration Curl';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'preacher-curl' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Preacher Curl';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'machine-preacher-curl' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Machine Preacher Curl';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'cable-curl' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Cable Curl';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'close-grip-bench-press' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Close-Grip Bench Press';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'skull-crusher' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Skull Crusher';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'overhead-dumbbell-extension' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Overhead Dumbbell Extension';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'dumbbell-kickback' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Dumbbell Kickback';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'machine-triceps-extension' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Machine Triceps Extension';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'cable-pushdown' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Cable Pushdown';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'rope-pushdown' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Rope Pushdown';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'overhead-cable-extension' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Overhead Cable Extension';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'triceps-dip' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Triceps Dip';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'back-squat' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Back Squat';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'front-squat' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Front Squat';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'romanian-deadlift' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Romanian Deadlift';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'goblet-squat' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Goblet Squat';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'dumbbell-walking-lunge' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Dumbbell Walking Lunge';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'bulgarian-split-squat' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Bulgarian Split Squat';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'leg-press' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Leg Press';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'hack-squat' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Hack Squat';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'smith-machine-squat' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Smith Machine Squat';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'leg-extension' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Leg Extension';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'lying-leg-curl' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Lying Leg Curl';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'seated-leg-curl' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Seated Leg Curl';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'hip-adduction-machine' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Hip Adduction Machine';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'standing-cable-leg-curl' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Standing Cable Leg Curl';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'barbell-hip-thrust' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Barbell Hip Thrust';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'sumo-deadlift' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Sumo Deadlift';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'dumbbell-step-up' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Dumbbell Step-Up';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'hip-abduction-machine' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Hip Abduction Machine';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'machine-glute-kickback' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Machine Glute Kickback';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'cable-glute-kickback' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Cable Glute Kickback';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'cable-pull-through' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Cable Pull-Through';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'glute-bridge' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Glute Bridge';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'standing-barbell-calf-raise' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Standing Barbell Calf Raise';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'dumbbell-calf-raise' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Dumbbell Calf Raise';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'standing-calf-raise-machine' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Standing Calf Raise Machine';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'seated-calf-raise' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Seated Calf Raise';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'leg-press-calf-raise' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Leg Press Calf Raise';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'cable-calf-raise' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Cable Calf Raise';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'barbell-rollout' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Barbell Rollout';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'dumbbell-side-bend' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Dumbbell Side Bend';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'russian-twist' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Russian Twist';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'ab-crunch-machine' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Ab Crunch Machine';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'cable-crunch' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Cable Crunch';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'cable-woodchopper' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Cable Woodchopper';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'crunch' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Crunch';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'hanging-leg-raise' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Hanging Leg Raise';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'plank' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Plank';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'ab-wheel-rollout' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Ab Wheel Rollout';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'barbell-wrist-curl' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Barbell Wrist Curl';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'reverse-barbell-curl' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Reverse Barbell Curl';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'dumbbell-wrist-curl' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Dumbbell Wrist Curl';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'farmers-walk' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Farmer''s Walk';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'behind-the-back-smith-wrist-curl' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Behind-the-Back Smith Wrist Curl';--> statement-breakpoint
UPDATE `exercises` SET `key` = 'cable-wrist-curl' WHERE `is_custom` = 0 AND `key` IS NULL AND `name_en` = 'Cable Wrist Curl';

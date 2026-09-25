ALTER TABLE `tasks` ADD `purpose` text;
--> statement-breakpoint
ALTER TABLE `tasks` ADD `category` text;
--> statement-breakpoint
ALTER TABLE `task_collaborators` ADD `role_in_task` text DEFAULT 'contributor' NOT NULL;
--> statement-breakpoint
ALTER TABLE `task_collaborators` ADD `contribution` text;
--> statement-breakpoint
ALTER TABLE `task_collaborators` ADD `notes` text;
--> statement-breakpoint
ALTER TABLE `task_deliverables` ADD `description` text;
--> statement-breakpoint
ALTER TABLE `task_deliverables` ADD `deliverable_type` text;
--> statement-breakpoint
ALTER TABLE `task_deliverables` ADD `notes` text;
--> statement-breakpoint
ALTER TABLE `task_completions` ADD `do_differently` text;
--> statement-breakpoint
ALTER TABLE `task_completions` ADD `remember_next` text;
--> statement-breakpoint
ALTER TABLE `task_completions` ADD `work_completed_at` integer;
--> statement-breakpoint
ALTER TABLE `task_completions` ADD `submitted_at` integer;
--> statement-breakpoint
ALTER TABLE `task_completions` ADD `overdue_days` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `planned_work` ADD `content_id` text;
--> statement-breakpoint
ALTER TABLE `planned_work` ADD `title` text;
--> statement-breakpoint
ALTER TABLE `planned_work` ADD `work_type` text DEFAULT 'planned_task_work' NOT NULL;
--> statement-breakpoint
CREATE TABLE `completion_deliverables` (
	`id` text PRIMARY KEY NOT NULL,
	`completion_id` text NOT NULL,
	`label` text NOT NULL,
	`url` text,
	`description` text NOT NULL,
	`deliverable_type` text,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`completion_id`) REFERENCES `task_completions`(`id`)
);
--> statement-breakpoint
CREATE TABLE `completion_people` (
	`id` text PRIMARY KEY NOT NULL,
	`completion_id` text NOT NULL,
	`person_id` text NOT NULL,
	`role_in_task` text NOT NULL,
	`contribution` text NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`completion_id`) REFERENCES `task_completions`(`id`),
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`)
);

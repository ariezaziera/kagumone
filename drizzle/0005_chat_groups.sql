CREATE TABLE IF NOT EXISTS `chat_stars` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id` text NOT NULL,
	`person_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `chat_messages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `chat_stars_unique` ON `chat_stars` (`message_id`,`person_id`);

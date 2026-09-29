ALTER TABLE `user` ADD `username` text;
--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);
--> statement-breakpoint
ALTER TABLE `people` ADD `username` text;
--> statement-breakpoint
ALTER TABLE `people` ADD `must_change_password` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `people_username_unique` ON `people` (`username`);

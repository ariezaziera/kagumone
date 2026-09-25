CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `activity_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`summary` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ai_conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ai_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`sources` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `approvals` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`related_type` text NOT NULL,
	`related_id` text NOT NULL,
	`requester_id` text NOT NULL,
	`reviewer_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`decision` text,
	`comment` text,
	`created_at` integer NOT NULL,
	`decided_at` integer,
	FOREIGN KEY (`requester_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`previous_value` text,
	`new_value` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `calendar_events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`kind` text DEFAULT 'meeting' NOT NULL,
	`start_at` integer NOT NULL,
	`end_at` integer NOT NULL,
	`related_type` text,
	`related_id` text,
	`owner_id` text,
	`tentative` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `content_approvals` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`reviewer_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`comment` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `contents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `content_benchmarks` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`source_url` text,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `contents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `content_corrections` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`qc_id` text,
	`request` text NOT NULL,
	`resolved` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `contents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`qc_id`) REFERENCES `content_qc`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `content_performance` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`platform` text NOT NULL,
	`metric_type` text NOT NULL,
	`value` text NOT NULL,
	`period` text,
	`source` text,
	`recorded_at` integer NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `contents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `content_production` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`notes` text,
	`produced_at` integer,
	FOREIGN KEY (`content_id`) REFERENCES `contents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `content_publications` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`platform` text NOT NULL,
	`caption` text,
	`scheduled_at` integer,
	`published_at` integer,
	`url` text,
	`status` text DEFAULT 'scheduled' NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `contents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `content_qc` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`stage` text NOT NULL,
	`reviewer_id` text,
	`checklist` text,
	`comments` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `contents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `contents` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`pillar` text,
	`platform` text,
	`content_type` text,
	`project_id` text,
	`owner_id` text,
	`creator_id` text,
	`stage` text DEFAULT 'planned' NOT NULL,
	`concept` text,
	`brief` text,
	`caption` text,
	`planned_publish_at` integer,
	`actual_publish_at` integer,
	`published_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`owner_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`creator_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `departments_code_unique` ON `departments` (`code`);--> statement-breakpoint
CREATE TABLE `employment_history` (
	`id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`status` text NOT NULL,
	`employment_type` text,
	`last_working_day` integer,
	`changed_by_id` text,
	`reason` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`changed_by_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `equipment` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`asset_code` text NOT NULL,
	`serial_number` text,
	`category` text NOT NULL,
	`location` text,
	`condition` text DEFAULT 'good' NOT NULL,
	`status_hint` text DEFAULT 'available' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `equipment_asset_code_unique` ON `equipment` (`asset_code`);--> statement-breakpoint
CREATE TABLE `equipment_conditions` (
	`id` text PRIMARY KEY NOT NULL,
	`equipment_id` text NOT NULL,
	`condition` text NOT NULL,
	`notes` text,
	`recorded_by_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`equipment_id`) REFERENCES `equipment`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recorded_by_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `equipment_loans` (
	`id` text PRIMARY KEY NOT NULL,
	`equipment_id` text NOT NULL,
	`borrower_id` text NOT NULL,
	`purpose` text NOT NULL,
	`project_id` text,
	`task_id` text,
	`content_id` text,
	`expected_return_at` integer NOT NULL,
	`actual_return_at` integer,
	`notes` text,
	`force_returned` integer DEFAULT false NOT NULL,
	`force_return_reason` text,
	`force_returned_by_id` text,
	`receiving_person_id` text,
	`return_condition` text,
	`status` text DEFAULT 'borrowed' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`equipment_id`) REFERENCES `equipment`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`borrower_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`content_id`) REFERENCES `contents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`force_returned_by_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`receiving_person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `equipment_maintenance` (
	`id` text PRIMARY KEY NOT NULL,
	`equipment_id` text NOT NULL,
	`notes` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	FOREIGN KEY (`equipment_id`) REFERENCES `equipment`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `equipment_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`loan_id` text NOT NULL,
	`kind` text NOT NULL,
	`file_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`loan_id`) REFERENCES `equipment_loans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`filename` text NOT NULL,
	`mime_type` text,
	`storage_key` text NOT NULL,
	`category` text,
	`related_type` text,
	`related_id` text,
	`uploader_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`uploader_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `handover_items` (
	`id` text PRIMARY KEY NOT NULL,
	`handover_id` text NOT NULL,
	`kind` text NOT NULL,
	`related_type` text,
	`related_id` text,
	`summary` text NOT NULL,
	FOREIGN KEY (`handover_id`) REFERENCES `handovers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `handovers` (
	`id` text PRIMARY KEY NOT NULL,
	`outgoing_person_id` text NOT NULL,
	`incoming_person_id` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`outgoing_person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`incoming_person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`person_id` text,
	`invited_by_id` text NOT NULL,
	`token` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`expires_at` integer NOT NULL,
	`accepted_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invitations_token_unique` ON `invitations` (`token`);--> statement-breakpoint
CREATE TABLE `knowledge_articles` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`body` text NOT NULL,
	`owner_id` text,
	`status` text DEFAULT 'published' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `knowledge_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	`body` text NOT NULL,
	`version` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `knowledge_articles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `kpi_actuals` (
	`id` text PRIMARY KEY NOT NULL,
	`target_id` text NOT NULL,
	`actual_value` integer NOT NULL,
	`evidence` text,
	`recorded_by_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`target_id`) REFERENCES `kpi_targets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recorded_by_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `kpi_history` (
	`id` text PRIMARY KEY NOT NULL,
	`target_id` text NOT NULL,
	`previous_value` integer,
	`new_value` integer,
	`changed_by_id` text,
	`reason` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`target_id`) REFERENCES `kpi_targets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`changed_by_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `kpi_periods` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`start_at` integer NOT NULL,
	`end_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `kpi_targets` (
	`id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`period_id` text NOT NULL,
	`category` text NOT NULL,
	`target_value` integer NOT NULL,
	`unit` text DEFAULT 'count' NOT NULL,
	`created_by_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`period_id`) REFERENCES `kpi_periods`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`kind` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`href` text,
	`kind` text NOT NULL,
	`read_at` integer,
	`handled_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `people` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`full_name` text NOT NULL,
	`preferred_name` text,
	`email` text NOT NULL,
	`position_title` text,
	`employment_type` text DEFAULT 'staff' NOT NULL,
	`organizational_status` text DEFAULT 'active' NOT NULL,
	`last_working_day` integer,
	`is_demo` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `people_user_idx` ON `people` (`user_id`);--> statement-breakpoint
CREATE INDEX `people_status_idx` ON `people` (`organizational_status`);--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `permissions_key_unique` ON `permissions` (`key`);--> statement-breakpoint
CREATE TABLE `person_departments` (
	`id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`department_id` text NOT NULL,
	`is_primary` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `person_roles` (
	`id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`role_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `person_skills` (
	`id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`skill_id` text NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`verified` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `planned_work` (
	`id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`task_id` text,
	`project_id` text,
	`start_at` integer NOT NULL,
	`end_at` integer NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project_history` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`actor_id` text,
	`field` text NOT NULL,
	`previous_value` text,
	`new_value` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project_members` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`person_id` text NOT NULL,
	`role_label` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project_phases` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`objective` text,
	`owner_id` text NOT NULL,
	`status` text DEFAULT 'planning' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`start_at` integer,
	`end_at` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reporting_relationships` (
	`id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`superior_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`superior_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `reporting_person_idx` ON `reporting_relationships` (`person_id`,`status`);--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`role_id` text NOT NULL,
	`permission_id` text NOT NULL,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `role_perm_unique` ON `role_permissions` (`role_id`,`permission_id`);--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_key_unique` ON `roles` (`key`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
CREATE TABLE `skill_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `skill_evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`person_skill_id` text NOT NULL,
	`note` text,
	`file_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`person_skill_id`) REFERENCES `person_skills`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text,
	`name` text NOT NULL,
	`description` text,
	FOREIGN KEY (`category_id`) REFERENCES `skill_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `task_assignees` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`person_id` text NOT NULL,
	`assigned_at` integer NOT NULL,
	`unassigned_at` integer,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `task_collaborators` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`person_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `task_completions` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`completed_by_id` text NOT NULL,
	`summary` text,
	`explanation` text,
	`learned` text,
	`self_reflection` text,
	`problems` text,
	`notes` text,
	`tools_used` text,
	`people_involved` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`completed_by_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `task_deliverables` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`label` text NOT NULL,
	`url` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `task_extensions` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`requester_id` text NOT NULL,
	`reviewer_id` text,
	`original_deadline` integer NOT NULL,
	`requested_deadline` integer NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`decision_comment` text,
	`decided_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requester_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `task_references` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`label` text NOT NULL,
	`url` text,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `task_subtasks` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`project_id` text,
	`creator_id` text NOT NULL,
	`assignee_id` text,
	`priority` text DEFAULT 'medium' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`official_deadline` integer,
	`planned_start_at` integer,
	`planned_end_at` integer,
	`assigned_at` integer,
	`acknowledged_at` integer,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`creator_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assignee_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `tasks_assignee_idx` ON `tasks` (`assignee_id`,`status`);--> statement-breakpoint
CREATE INDEX `tasks_deadline_idx` ON `tasks` (`official_deadline`);--> statement-breakpoint
CREATE TABLE `time_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`task_id` text,
	`project_id` text,
	`work_date` text NOT NULL,
	`planned_minutes` integer DEFAULT 0 NOT NULL,
	`actual_minutes` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

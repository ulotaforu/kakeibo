CREATE TABLE `household_invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`inviter_id` text NOT NULL,
	`invitee_email` text NOT NULL,
	`invitee_id` text,
	`status` integer DEFAULT 0 NOT NULL,
	`token` text NOT NULL,
	`sent_at` text NOT NULL,
	`responded_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`inviter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invitee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `household_invitations_token_unique` ON `household_invitations` (`token`);
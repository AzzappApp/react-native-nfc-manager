DROP INDEX `ContactCard_profileId_idx` ON `ContactCard`;--> statement-breakpoint
ALTER TABLE `ContactCard` ADD PRIMARY KEY (`profileId`);--> statement-breakpoint
CREATE FULLTEXT INDEX `Profile_search` ON `Profile` (`userName`);
CREATE TABLE `ContactCard` (
	`firstName` varchar(191),
	`lastName` varchar(191),
	`title` varchar(191),
	`company` varchar(191),
	`emails` json,
	`phoneNumbers` json,
	`profileId` varchar(191) NOT NULL,
	`public` tinyint(1) DEFAULT false,
	`isDisplayedOnWebCard` tinyint(1) DEFAULT false,
	`backgroundStyle` json DEFAULT ('{"backgroundColor":"#000000"}'));

ALTER TABLE `CardCover` MODIFY COLUMN `textPreviewMediaId` varchar(191);
CREATE UNIQUE INDEX `ContactCard_profileId_idx` ON `ContactCard` (`profileId`);
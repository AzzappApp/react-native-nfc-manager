-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `Card` (
	`id` varchar(191) PRIMARY KEY NOT NULL,
	`isMain` tinyint NOT NULL,
	`coverId` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`profileId` varchar(191) NOT NULL,
	`updatedAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`backgroundColor` varchar(191));

CREATE TABLE `CardCover` (
	`id` varchar(191) PRIMARY KEY NOT NULL,
	`title` varchar(191),
	`backgroundId` varchar(191),
	`backgroundStyle` json,
	`contentStyle` json,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`foregroundId` varchar(191),
	`foregroundStyle` json,
	`maskMediaId` varchar(191),
	`mediaId` varchar(191) NOT NULL,
	`mediaStyle` json NOT NULL,
	`merged` tinyint NOT NULL,
	`segmented` tinyint NOT NULL,
	`sourceMediaId` varchar(191) NOT NULL,
	`subTitle` varchar(191),
	`subTitleStyle` json,
	`textPreviewMediaId` varchar(191) NOT NULL,
	`titleStyle` json,
	`updatedAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)));

CREATE TABLE `CardModule` (
	`id` varchar(191) PRIMARY KEY NOT NULL,
	`kind` varchar(191) NOT NULL,
	`cardId` varchar(191) NOT NULL,
	`data` json NOT NULL,
	`position` int NOT NULL,
	`visible` tinyint NOT NULL DEFAULT 1);

CREATE TABLE `CompanyActivity` (
	`id` varchar(191) PRIMARY KEY NOT NULL,
	`labels` json NOT NULL,
	`profileCategoryId` varchar(191) NOT NULL,
	`order` int NOT NULL);

CREATE TABLE `CoverTemplate` (
	`id` varchar(191) PRIMARY KEY NOT NULL,
	`name` varchar(191) NOT NULL,
	`colorPalette` varchar(191),
	`enabled` tinyint NOT NULL DEFAULT 1,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updatedAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`data` json NOT NULL,
	`merged` tinyint NOT NULL,
	`segmented` tinyint NOT NULL,
	`tags` varchar(191),
	`category` json,
	`kind` enum('personal','business') NOT NULL,
	`previewMediaId` varchar(191),
	`suggested` tinyint NOT NULL DEFAULT 0,
	`companyActivityIds` varchar(191));

CREATE TABLE `Follow` (
	`followerId` varchar(191) NOT NULL,
	`followingId` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	PRIMARY KEY(`followerId`,`followingId`)
);

CREATE TABLE `Interest` (
	`tag` varchar(191) NOT NULL,
	`labels` json NOT NULL,
	`id` varchar(191) PRIMARY KEY NOT NULL);

CREATE TABLE `Media` (
	`id` varchar(191) PRIMARY KEY NOT NULL,
	`kind` enum('image','video') NOT NULL,
	`height` double NOT NULL,
	`width` double NOT NULL);

CREATE TABLE `Post` (
	`id` varchar(191) PRIMARY KEY NOT NULL,
	`authorId` varchar(191) NOT NULL,
	`content` text NOT NULL,
	`allowComments` tinyint NOT NULL,
	`allowLikes` tinyint NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`medias` json NOT NULL,
	`counterReactions` int NOT NULL DEFAULT 0,
	`counterComments` int NOT NULL DEFAULT 0);

CREATE TABLE `PostComment` (
	`id` varchar(191) PRIMARY KEY NOT NULL,
	`profileId` varchar(191) NOT NULL,
	`postId` varchar(191) NOT NULL,
	`comment` text NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)));

CREATE TABLE `PostReaction` (
	`profileId` varchar(191) NOT NULL,
	`postId` varchar(191) NOT NULL,
	`reactionKind` enum('like') NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	PRIMARY KEY(`postId`,`profileId`)
);

CREATE TABLE `Profile` (
	`id` varchar(191) PRIMARY KEY NOT NULL,
	`userId` varchar(191) NOT NULL,
	`userName` varchar(191) NOT NULL,
	`firstName` varchar(191),
	`lastName` varchar(191),
	`profileKind` enum('personal','business') NOT NULL,
	`companyName` varchar(191),
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updatedAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`colorPalette` varchar(191),
	`profileCategoryId` varchar(191),
	`interests` varchar(191),
	`companyActivityId` varchar(191),
	`public` tinyint NOT NULL DEFAULT 0);

CREATE TABLE `ProfileCategory` (
	`id` varchar(191) PRIMARY KEY NOT NULL,
	`profileKind` enum('personal','business') NOT NULL,
	`labels` json NOT NULL,
	`medias` json NOT NULL,
	`available` tinyint NOT NULL DEFAULT 1,
	`order` int NOT NULL);

CREATE TABLE `StaticMedia` (
	`id` varchar(191) PRIMARY KEY NOT NULL,
	`usage` enum('coverForeground','coverBackground','moduleBackground') NOT NULL,
	`name` varchar(191),
	`available` tinyint NOT NULL DEFAULT 1,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`tags` varchar(191));

CREATE TABLE `User` (
	`id` varchar(191) PRIMARY KEY NOT NULL,
	`email` varchar(191),
	`password` varchar(191),
	`phoneNumber` varchar(191),
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updatedAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`roles` json);

CREATE INDEX `Card_profileId_idx` ON `Card` (`profileId`);
CREATE INDEX `CardModule_cardId_idx` ON `CardModule` (`cardId`);
CREATE INDEX `Follow_followerId_idx` ON `Follow` (`followerId`);
CREATE INDEX `Follow_followingId_idx` ON `Follow` (`followingId`);
CREATE INDEX `Post_authorId_idx` ON `Post` (`authorId`);
CREATE INDEX `PostComment_postId_idx` ON `PostComment` (`postId`);
CREATE INDEX `PostReaction_postId_idx` ON `PostReaction` (`postId`);
CREATE INDEX `PostReaction_profileId_idx` ON `PostReaction` (`profileId`);
CREATE INDEX `Profile_userId_idx` ON `Profile` (`userId`);
CREATE UNIQUE INDEX `Profile_userName_key` ON `Profile` (`userName`);
CREATE UNIQUE INDEX `User_email_key` ON `User` (`email`);
CREATE UNIQUE INDEX `User_phoneNumber_key` ON `User` (`phoneNumber`);
*/
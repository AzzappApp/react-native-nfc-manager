CREATE TABLE `CardModule` (
	`id` text(24) PRIMARY KEY NOT NULL,
	`webCardId` text(24) NOT NULL,
	`kind` text NOT NULL,
	`data` text NOT NULL,
	`position` integer NOT NULL,
	`visible` boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `CardStyle` (
	`id` text(24) PRIMARY KEY NOT NULL,
	`labelKey` text(191) DEFAULT '' NOT NULL,
	`fontFamily` text(191) NOT NULL,
	`fontSize` integer NOT NULL,
	`titleFontFamily` text(191) NOT NULL,
	`titleFontSize` integer NOT NULL,
	`borderRadius` integer NOT NULL,
	`borderWidth` integer NOT NULL,
	`borderColor` text(9) NOT NULL,
	`buttonColor` text(9) NOT NULL,
	`buttonRadius` integer NOT NULL,
	`gap` integer NOT NULL,
	`enabled` boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `CardTemplate` (
	`id` text(24) PRIMARY KEY NOT NULL,
	`labelKey` text(191) DEFAULT '' NOT NULL,
	`cardStyleId` text(24) NOT NULL,
	`cardTemplateTypeId` text(24),
	`previewMediaId` text(26),
	`modules` text NOT NULL,
	`businessEnabled` boolean DEFAULT true NOT NULL,
	`personalEnabled` boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `CardTemplateType` (
	`id` text(24) PRIMARY KEY NOT NULL,
	`labelKey` text(191) DEFAULT '' NOT NULL,
	`webCardCategoryId` text(24) NOT NULL,
	`enabled` boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ColorPalette` (
	`id` text(24) PRIMARY KEY NOT NULL,
	`primary` text(9) NOT NULL,
	`dark` text(9) NOT NULL,
	`light` text(9) NOT NULL,
	`enabled` boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `CompanyActivity` (
	`id` text(24) PRIMARY KEY NOT NULL,
	`labelKey` text(191) DEFAULT '' NOT NULL,
	`cardTemplateTypeId` text(24)
);
--> statement-breakpoint
CREATE TABLE `WebCardCategoryCompanyActivity` (
	`categoryId` text(24) NOT NULL,
	`companyActivityId` text(24) NOT NULL,
	`order` integer NOT NULL,
	PRIMARY KEY(`categoryId`, `companyActivityId`)
);
--> statement-breakpoint
CREATE TABLE `CoverTemplate` (
	`id` text(24) PRIMARY KEY NOT NULL,
	`name` text(191) NOT NULL,
	`kind` text NOT NULL,
	`previewMediaId` text(26) NOT NULL,
	`data` text NOT NULL,
	`colorPaletteId` text(24) NOT NULL,
	`businessEnabled` boolean DEFAULT true NOT NULL,
	`personalEnabled` boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Follow` (
	`followerId` text(24) NOT NULL,
	`followingId` text(24) NOT NULL,
	`createdAt` date DEFAULT current_timestamp NOT NULL,
	PRIMARY KEY(`followerId`, `followingId`)
);
--> statement-breakpoint
CREATE TABLE `Media` (
	`id` text(26) PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`height` real NOT NULL,
	`width` real NOT NULL,
	`refCount` integer DEFAULT 0 NOT NULL,
	`createdAt` date DEFAULT current_timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE `MediaSuggestion` (
	`id` text(24) PRIMARY KEY NOT NULL,
	`mediaId` text(26) NOT NULL,
	`webCardCategoryId` text(24),
	`companyActivityId` text(24)
);
--> statement-breakpoint
CREATE TABLE `PostComment` (
	`id` text(24) PRIMARY KEY NOT NULL,
	`webCardId` text(24) NOT NULL,
	`postId` text(24) NOT NULL,
	`comment` text NOT NULL,
	`createdAt` date DEFAULT current_timestamp NOT NULL,
	`deleted` boolean DEFAULT false NOT NULL,
	`deletedBy` text(24),
	`deletedAt` date DEFAULT current_timestamp
);
--> statement-breakpoint
CREATE TABLE `PostReaction` (
	`webCardId` text(24) NOT NULL,
	`postId` text(24) NOT NULL,
	`reactionKind` text NOT NULL,
	`createdAt` date DEFAULT current_timestamp NOT NULL,
	PRIMARY KEY(`postId`, `reactionKind`, `webCardId`)
);
--> statement-breakpoint
CREATE TABLE `Post` (
	`id` text(24) PRIMARY KEY NOT NULL,
	`webCardId` text(24) NOT NULL,
	`content` text,
	`allowComments` boolean NOT NULL,
	`allowLikes` boolean NOT NULL,
	`medias` text NOT NULL,
	`counterReactions` integer DEFAULT 0 NOT NULL,
	`counterComments` integer DEFAULT 0 NOT NULL,
	`createdAt` date DEFAULT current_timestamp NOT NULL,
	`updatedAt` date DEFAULT current_timestamp NOT NULL,
	`deleted` boolean DEFAULT false NOT NULL,
	`deletedBy` text(24),
	`deletedAt` date DEFAULT current_timestamp
);
--> statement-breakpoint
CREATE TABLE `WebCardCategory` (
	`id` text(24) PRIMARY KEY NOT NULL,
	`webCardKind` text NOT NULL,
	`cardTemplateTypeId` text(24),
	`labelKey` text(191) DEFAULT '' NOT NULL,
	`medias` text NOT NULL,
	`order` integer NOT NULL,
	`enabled` boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Profile` (
	`id` text(24) PRIMARY KEY NOT NULL,
	`userId` text(24) NOT NULL,
	`webCardId` text(24) NOT NULL,
	`profileRole` text(6) DEFAULT 'owner' NOT NULL,
	`invited` boolean DEFAULT false NOT NULL,
	`inviteSent` boolean DEFAULT false NOT NULL,
	`promotedAsOwner` boolean DEFAULT false NOT NULL,
	`avatarId` text(26),
	`contactCard` text,
	`contactCardIsPrivate` boolean DEFAULT true NOT NULL,
	`contactCardDisplayedOnWebCard` boolean DEFAULT false NOT NULL,
	`createdAt` date DEFAULT current_timestamp NOT NULL,
	`lastContactCardUpdate` date DEFAULT current_timestamp NOT NULL,
	`nbContactCardScans` integer DEFAULT 0 NOT NULL,
	`deleted` boolean DEFAULT false NOT NULL,
	`deletedAt` date DEFAULT current_timestamp,
	`deletedBy` text(24)
);
--> statement-breakpoint
CREATE TABLE `RedirectWebCard` (
	`fromUserName` text(191) PRIMARY KEY NOT NULL,
	`toUserName` text(191) NOT NULL,
	`createdAt` date DEFAULT current_timestamp NOT NULL,
	`expiresAt` date DEFAULT current_timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE `StaticMedia` (
	`id` text(191) PRIMARY KEY NOT NULL,
	`usage` text NOT NULL,
	`resizeMode` text DEFAULT 'cover',
	`order` integer NOT NULL,
	`enabled` boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `User` (
	`id` text(24) PRIMARY KEY NOT NULL,
	`email` text(191),
	`password` text(191),
	`phoneNumber` text(191),
	`createdAt` date DEFAULT current_timestamp NOT NULL,
	`updatedAt` date DEFAULT current_timestamp NOT NULL,
	`roles` text,
	`invited` boolean DEFAULT false NOT NULL,
	`locale` text(191),
	`emailConfirmed` boolean DEFAULT false NOT NULL,
	`phoneNumberConfirmed` boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `WebCardStatistic` (
	`webCardId` text(24) NOT NULL,
	`day` date DEFAULT current_date NOT NULL,
	`webCardViews` integer DEFAULT 0 NOT NULL,
	`likes` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`day`, `webCardId`)
);
--> statement-breakpoint
CREATE TABLE `ProfileStatistic` (
	`profileId` text(24) NOT NULL,
	`day` date DEFAULT current_date NOT NULL,
	`contactCardScans` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`day`, `profileId`)
);
--> statement-breakpoint
CREATE TABLE `WebCard` (
	`id` text(24) PRIMARY KEY NOT NULL,
	`userName` text(191) NOT NULL,
	`lastUserNameUpdate` date DEFAULT current_timestamp NOT NULL,
	`webCardKind` text NOT NULL,
	`webCardCategoryId` text(24),
	`firstName` text(191),
	`lastName` text(191),
	`commonInformation` text,
	`companyName` text(191),
	`companyActivityId` text(24),
	`createdAt` date DEFAULT current_timestamp NOT NULL,
	`updatedAt` date DEFAULT current_timestamp NOT NULL,
	`isMultiUser` boolean DEFAULT false NOT NULL,
	`locale` text(191),
	`cardColors` text,
	`cardStyle` text,
	`cardIsPrivate` boolean DEFAULT false NOT NULL,
	`cardIsPublished` boolean DEFAULT false NOT NULL,
	`alreadyPublished` boolean DEFAULT false NOT NULL,
	`lastCardUpdate` date DEFAULT current_timestamp NOT NULL,
	`coverTitle` text(191),
	`coverSubTitle` text(191),
	`coverData` text,
	`nbFollowers` integer DEFAULT 0 NOT NULL,
	`nbFollowings` integer DEFAULT 0 NOT NULL,
	`nbPosts` integer DEFAULT 0 NOT NULL,
	`nbPostsLiked` integer DEFAULT 0 NOT NULL,
	`nbLikes` integer DEFAULT 0 NOT NULL,
	`nbWebCardViews` integer DEFAULT 0 NOT NULL,
	`deleted` boolean DEFAULT false NOT NULL,
	`deletedAt` date DEFAULT current_timestamp,
	`deletedBy` text(24)
);
--> statement-breakpoint
CREATE TABLE `Report` (
	`targetId` text(191) NOT NULL,
	`userId` text(191) NOT NULL,
	`targetType` text NOT NULL,
	`createdAt` date DEFAULT current_timestamp NOT NULL,
	`treatedBy` text(191),
	`treatedAt` date DEFAULT current_timestamp,
	PRIMARY KEY(`targetId`, `targetType`, `userId`)
);
--> statement-breakpoint
CREATE INDEX `CardModule_webCardId_idx` ON `CardModule` (`webCardId`);--> statement-breakpoint
CREATE INDEX `Follow_followingId_key` ON `Follow` (`followingId`);--> statement-breakpoint
CREATE INDEX `MediaSuggestion_webCardCategoryId_key` ON `MediaSuggestion` (`webCardCategoryId`);--> statement-breakpoint
CREATE INDEX `MediaSuggestion_companyActivityId_key` ON `MediaSuggestion` (`companyActivityId`);--> statement-breakpoint
CREATE INDEX `PostComment_postId_idx` ON `PostComment` (`postId`);--> statement-breakpoint
CREATE INDEX `PostReaction_webCardId_key` ON `PostReaction` (`webCardId`);--> statement-breakpoint
CREATE INDEX `Post_webCardId_idx` ON `Post` (`webCardId`);--> statement-breakpoint
CREATE UNIQUE INDEX `Profile_user_webcard_key` ON `Profile` (`userId`,`webCardId`);--> statement-breakpoint
CREATE INDEX `Profile_webCardId_key` ON `Profile` (`webCardId`,`profileRole`);--> statement-breakpoint
CREATE INDEX `Profile_promotedAsOwner_key` ON `Profile` (`webCardId`,`promotedAsOwner`);--> statement-breakpoint
CREATE UNIQUE INDEX `User_email_key` ON `User` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `User_phoneNumber_key` ON `User` (`phoneNumber`);--> statement-breakpoint
CREATE UNIQUE INDEX `WebCard_userName_key` ON `WebCard` (`userName`);--> statement-breakpoint
CREATE INDEX `WebCard_search` ON `WebCard` (`userName`);--> statement-breakpoint
CREATE INDEX `Report_targetType_key` ON `Report` (`targetType`,`createdAt`,`treatedBy`);
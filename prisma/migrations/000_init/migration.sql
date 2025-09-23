-- CreateTable
CREATE TABLE `OpenIddictApplications` (
    `Id` VARCHAR(255) NOT NULL,
    `ApplicationType` VARCHAR(50) NULL,
    `ClientId` VARCHAR(191) NOT NULL,
    `ClientSecret` LONGTEXT NULL,
    `ClientType` VARCHAR(50) NULL,
    `ConcurrencyToken` VARCHAR(50) NULL,
    `ConsentType` VARCHAR(50) NULL,
    `DisplayName` LONGTEXT NULL,
    `DisplayNames` LONGTEXT NULL,
    `JsonWebKeySet` LONGTEXT NULL,
    `Permissions` LONGTEXT NULL,
    `PostLogoutRedirectUris` LONGTEXT NULL,
    `Properties` LONGTEXT NULL,
    `RedirectUris` LONGTEXT NULL,
    `Requirements` LONGTEXT NULL,
    `Settings` LONGTEXT NULL,

    UNIQUE INDEX `IX_OpenIddictApplications_ClientId`(`ClientId` ASC),
    PRIMARY KEY (`Id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OpenIddictAuthorizations` (
    `Id` VARCHAR(255) NOT NULL,
    `ApplicationId` VARCHAR(255) NULL,
    `ConcurrencyToken` VARCHAR(50) NULL,
    `CreationDate` DATETIME(6) NULL,
    `Properties` LONGTEXT NULL,
    `Scopes` LONGTEXT NULL,
    `Status` VARCHAR(50) NULL,
    `Subject` VARCHAR(191) NULL,
    `Type` VARCHAR(50) NULL,

    INDEX `IX_OpenIddictAuthorizations_ApplicationId_Status_Subject_Type`(`ApplicationId` ASC, `Status` ASC, `Subject` ASC, `Type` ASC),
    PRIMARY KEY (`Id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OpenIddictScopes` (
    `Id` VARCHAR(255) NOT NULL,
    `ConcurrencyToken` VARCHAR(50) NULL,
    `Description` LONGTEXT NULL,
    `Descriptions` LONGTEXT NULL,
    `DisplayName` LONGTEXT NULL,
    `DisplayNames` LONGTEXT NULL,
    `Name` VARCHAR(191) NOT NULL,
    `Properties` LONGTEXT NULL,
    `Resources` LONGTEXT NULL,

    UNIQUE INDEX `IX_OpenIddictScopes_Name`(`Name` ASC),
    PRIMARY KEY (`Id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OpenIddictTokens` (
    `Id` VARCHAR(255) NOT NULL,
    `ApplicationId` VARCHAR(255) NULL,
    `AuthorizationId` VARCHAR(255) NULL,
    `ConcurrencyToken` VARCHAR(50) NULL,
    `CreationDate` DATETIME(6) NULL,
    `ExpirationDate` DATETIME(6) NULL,
    `Payload` LONGTEXT NULL,
    `Properties` LONGTEXT NULL,
    `RedemptionDate` DATETIME(6) NULL,
    `ReferenceId` VARCHAR(100) NULL,
    `Status` VARCHAR(100) NULL,
    `Subject` VARCHAR(191) NULL,
    `Type` VARCHAR(100) NULL,

    INDEX `IX_OpenIddictTokens_ApplicationId_Status_Subject_Type`(`ApplicationId` ASC, `Status` ASC, `Subject` ASC, `Type` ASC),
    INDEX `IX_OpenIddictTokens_AuthorizationId`(`AuthorizationId` ASC),
    UNIQUE INDEX `IX_OpenIddictTokens_ReferenceId`(`ReferenceId` ASC),
    PRIMARY KEY (`Id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `__EFMigrationsHistory` (
    `MigrationId` VARCHAR(150) NOT NULL,
    `ProductVersion` VARCHAR(32) NOT NULL,

    PRIMARY KEY (`MigrationId` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account` (
    `id` VARCHAR(36) NOT NULL,
    `accountId` TEXT NOT NULL,
    `providerId` TEXT NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `accessToken` TEXT NULL,
    `refreshToken` TEXT NULL,
    `idToken` TEXT NULL,
    `accessTokenExpiresAt` DATETIME(0) NULL,
    `refreshTokenExpiresAt` DATETIME(0) NULL,
    `scope` TEXT NULL,
    `password` TEXT NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `channel` (
    `id` CHAR(36) NOT NULL,
    `guildId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `type` ENUM('TEXT', 'VOICE', 'CATEGORY') NOT NULL DEFAULT 'TEXT',
    `topic` VARCHAR(500) NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `isPrivate` BOOLEAN NOT NULL DEFAULT false,
    `parentId` CHAR(36) NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `channel_guild_idx`(`guildId` ASC),
    INDEX `channel_parent_idx`(`parentId` ASC),
    UNIQUE INDEX `channel_slug_per_guild`(`guildId` ASC, `slug` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `channel_member` (
    `channelId` CHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `addedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `channel_member_user_idx`(`userId` ASC),
    PRIMARY KEY (`channelId` ASC, `userId` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dm_pair_unique` (
    `id` CHAR(36) NOT NULL,
    `userA` VARCHAR(36) NOT NULL,
    `userB` VARCHAR(36) NOT NULL,
    `roomId` CHAR(36) NOT NULL,

    INDEX `dm_pair_room_idx`(`roomId` ASC),
    UNIQUE INDEX `dm_pair_users_unique`(`userA` ASC, `userB` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `url` VARCHAR(500) NULL,
    `start_time` DATETIME(0) NOT NULL,
    `end_time` DATETIME(0) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_by` VARCHAR(36) NOT NULL,
    `updated_by` VARCHAR(36) NOT NULL,
    `location` VARCHAR(255) NULL,
    `image_url` TEXT NULL,

    INDEX `event_created_by_FK`(`created_by` ASC),
    INDEX `event_end_time_IDX`(`end_time` ASC),
    INDEX `event_start_time_IDX`(`start_time` ASC),
    INDEX `event_updated_by_FK`(`updated_by` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `faq` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `question` VARCHAR(500) NOT NULL,
    `answer` TEXT NOT NULL,
    `published` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_by` VARCHAR(36) NOT NULL,
    `updated_by` VARCHAR(36) NOT NULL,

    INDEX `faq_created_by_FK`(`created_by` ASC),
    INDEX `faq_published_IDX`(`published` ASC),
    INDEX `faq_updated_by_FK`(`updated_by` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `game` (
    `id` CHAR(36) NOT NULL,
    `size_gb` DOUBLE NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `folder_slug` VARCHAR(100) NOT NULL,
    `version` VARCHAR(50) NULL,
    `genres` TEXT NOT NULL,
    `platforms` TEXT NULL,
    `game_modes` TEXT NOT NULL,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `date_updated` DATE NULL,
    `date_added` DATE NULL,
    `editor_name` VARCHAR(255) NULL,
    `main_process_name` VARCHAR(255) NULL,
    `cover` TEXT NULL,
    `logo` TEXT NULL,
    `screenshots` TEXT NOT NULL,
    `description` TEXT NULL,
    `start_command` TEXT NULL,
    `max_players` INTEGER NOT NULL,
    `use_notifications` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_by` VARCHAR(36) NOT NULL,
    `updated_by` VARCHAR(36) NOT NULL,

    INDEX `game_folder_slug_IDX`(`folder_slug` ASC),
    UNIQUE INDEX `game_folder_slug_key`(`folder_slug` ASC),
    INDEX `game_user_created_FK`(`created_by` ASC),
    INDEX `game_user_updated_FK`(`updated_by` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `game_session` (
    `id` CHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `game_slug` VARCHAR(36) NOT NULL,
    `start_time` DATETIME(0) NOT NULL,
    `end_time` DATETIME(0) NULL,
    `total_seconds` INTEGER NULL,

    INDEX `game_session_user_id_fkey`(`user_id` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `global_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_by` VARCHAR(36) NOT NULL,
    `updated_by` VARCHAR(36) NOT NULL,

    UNIQUE INDEX `global_settings_key_key`(`key` ASC),
    INDEX `global_settings_user_FK`(`created_by` ASC),
    INDEX `global_settings_user_FK_1`(`updated_by` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `guild` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `icon` TEXT NULL,
    `ownerId` VARCHAR(36) NOT NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `guild_owner_FK`(`ownerId` ASC),
    UNIQUE INDEX `guild_slug_key`(`slug` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `guild_member` (
    `id` CHAR(36) NOT NULL,
    `guildId` CHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `nickname` VARCHAR(100) NULL,
    `roles` TEXT NULL,
    `joinedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `guild_member_guild_idx`(`guildId` ASC),
    UNIQUE INDEX `guild_member_unique`(`guildId` ASC, `userId` ASC),
    INDEX `guild_member_user_idx`(`userId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invitation` (
    `id` VARCHAR(36) NOT NULL,
    `organizationId` VARCHAR(36) NOT NULL,
    `email` TEXT NOT NULL,
    `role` TEXT NULL,
    `status` TEXT NOT NULL,
    `expiresAt` DATETIME(0) NOT NULL,
    `inviterId` VARCHAR(36) NOT NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jwks` (
    `id` VARCHAR(36) NOT NULL,
    `publicKey` TEXT NOT NULL,
    `privateKey` TEXT NOT NULL,
    `createdAt` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `member` (
    `id` VARCHAR(36) NOT NULL,
    `organizationId` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `role` TEXT NOT NULL,
    `createdAt` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message` (
    `id` CHAR(36) NOT NULL,
    `roomId` CHAR(36) NOT NULL,
    `authorId` VARCHAR(36) NOT NULL,
    `type` ENUM('TEXT', 'SYSTEM', 'EVENT') NOT NULL DEFAULT 'TEXT',
    `content` TEXT NULL,
    `attachments` TEXT NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `editedAt` DATETIME(0) NULL,
    `deletedAt` DATETIME(0) NULL,

    INDEX `message_author_created_idx`(`authorId` ASC, `createdAt` ASC),
    INDEX `message_room_created_id_idx`(`roomId` ASC, `createdAt` ASC, `id` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message_reaction` (
    `messageId` CHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `emoji` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `IX_message_emoji`(`messageId` ASC, `emoji` ASC),
    INDEX `message_reaction_user_idx`(`userId` ASC),
    PRIMARY KEY (`messageId` ASC, `userId` ASC, `emoji` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message_read` (
    `messageId` CHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `readAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `message_read_user_idx`(`userId` ASC, `readAt` ASC),
    PRIMARY KEY (`messageId` ASC, `userId` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organization` (
    `id` VARCHAR(36) NOT NULL,
    `name` TEXT NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `logo` TEXT NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `metadata` TEXT NULL,

    UNIQUE INDEX `slug`(`slug` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role` (
    `name` VARCHAR(100) NOT NULL,
    `nameplate_decoration_animated` TEXT NULL,
    `nameplate_decoration_static` TEXT NULL,
    `avatar_decoration_animated` TEXT NULL,
    `avatar_decoration_static` TEXT NULL,

    UNIQUE INDEX `role_name_key`(`name` ASC),
    PRIMARY KEY (`name` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room` (
    `id` CHAR(36) NOT NULL,
    `type` ENUM('DM', 'GROUP', 'GUILD_CHANNEL') NOT NULL,
    `name` VARCHAR(255) NULL,
    `ownerId` VARCHAR(36) NULL,
    `guildId` CHAR(36) NULL,
    `channelId` CHAR(36) NULL,
    `lastMessageAt` DATETIME(0) NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `room_guild_idx`(`guildId` ASC),
    INDEX `room_lastMessageAt_idx`(`lastMessageAt` ASC),
    INDEX `room_ownerId_fkey`(`ownerId` ASC),
    INDEX `room_type_idx`(`type` ASC),
    UNIQUE INDEX `room_unique_channel`(`channelId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room_participant` (
    `roomId` CHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `joinedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `isMuted` BOOLEAN NOT NULL DEFAULT false,
    `isPinned` BOOLEAN NOT NULL DEFAULT false,

    INDEX `room_participant_user_idx`(`userId` ASC),
    PRIMARY KEY (`roomId` ASC, `userId` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room_view` (
    `roomId` CHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `lastSeenAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `room_view_user_idx`(`userId` ASC, `lastSeenAt` ASC),
    PRIMARY KEY (`roomId` ASC, `userId` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session` (
    `id` VARCHAR(36) NOT NULL,
    `expiresAt` DATETIME(0) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,
    `ipAddress` TEXT NULL,
    `userAgent` TEXT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `impersonatedBy` TEXT NULL,
    `activeOrganizationId` TEXT NULL,

    UNIQUE INDEX `token`(`token` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sidelink` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `url` VARCHAR(100) NOT NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `createdBy` VARCHAR(36) NOT NULL,
    `updatedBy` VARCHAR(36) NOT NULL,
    `hidden` BOOLEAN NOT NULL DEFAULT false,

    INDEX `sidelink_user_FK`(`createdBy` ASC),
    INDEX `sidelink_user_FK_1`(`updatedBy` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(36) NOT NULL,
    `name` TEXT NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `emailVerified` BOOLEAN NOT NULL,
    `image` TEXT NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,
    `username` VARCHAR(255) NULL,
    `role` VARCHAR(100) NOT NULL DEFAULT 'user',
    `banned` BOOLEAN NULL,
    `banReason` TEXT NULL,
    `banExpires` DATETIME(0) NULL,
    `displayUsername` TEXT NULL,
    `lastLogin` DATETIME(0) NULL,

    UNIQUE INDEX `email`(`email` ASC),
    UNIQUE INDEX `username`(`username` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_game` (
    `user_id` VARCHAR(36) NOT NULL,
    `game_slug` VARCHAR(100) NOT NULL,
    `installed_at` DATETIME(0) NULL,

    INDEX `user_game_game_slug_FK`(`game_slug` ASC),
    INDEX `user_game_slug_installed_at_idx`(`game_slug` ASC, `installed_at` ASC),
    INDEX `user_game_user_id_FK`(`user_id` ASC),
    PRIMARY KEY (`user_id` ASC, `game_slug` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(36) NOT NULL,
    `local_games_dir` TEXT NOT NULL,

    UNIQUE INDEX `user_settings_user_id_key`(`user_id` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `username_file_config` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `folder_slug` VARCHAR(100) NULL,
    `path` VARCHAR(200) NULL,
    `variable` VARCHAR(200) NULL,
    `config_type` VARCHAR(100) NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification` (
    `id` VARCHAR(36) NOT NULL,
    `identifier` TEXT NOT NULL,
    `value` TEXT NOT NULL,
    `expiresAt` DATETIME(0) NOT NULL,
    `createdAt` DATETIME(0) NULL,
    `updatedAt` DATETIME(0) NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OpenIddictAuthorizations` ADD CONSTRAINT `FK_OpenIddictAuthorizations_OpenIddictApplications_ApplicationId` FOREIGN KEY (`ApplicationId`) REFERENCES `OpenIddictApplications`(`Id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `OpenIddictTokens` ADD CONSTRAINT `FK_OpenIddictTokens_OpenIddictApplications_ApplicationId` FOREIGN KEY (`ApplicationId`) REFERENCES `OpenIddictApplications`(`Id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `OpenIddictTokens` ADD CONSTRAINT `FK_OpenIddictTokens_OpenIddictAuthorizations_AuthorizationId` FOREIGN KEY (`AuthorizationId`) REFERENCES `OpenIddictAuthorizations`(`Id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `channel` ADD CONSTRAINT `channel_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `guild`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `channel` ADD CONSTRAINT `channel_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `channel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `channel_member` ADD CONSTRAINT `channel_member_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `channel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `channel_member` ADD CONSTRAINT `channel_member_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dm_pair_unique` ADD CONSTRAINT `dm_pair_unique_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event` ADD CONSTRAINT `event_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `event` ADD CONSTRAINT `event_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `faq` ADD CONSTRAINT `faq_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `faq` ADD CONSTRAINT `faq_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `game` ADD CONSTRAINT `game_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `game` ADD CONSTRAINT `game_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `game_session` ADD CONSTRAINT `game_session_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guild` ADD CONSTRAINT `guild_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guild_member` ADD CONSTRAINT `guild_member_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `guild`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guild_member` ADD CONSTRAINT `guild_member_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message` ADD CONSTRAINT `message_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message` ADD CONSTRAINT `message_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_reaction` ADD CONSTRAINT `message_reaction_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `message`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_reaction` ADD CONSTRAINT `message_reaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_read` ADD CONSTRAINT `message_read_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `message`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_read` ADD CONSTRAINT `message_read_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room` ADD CONSTRAINT `room_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `channel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room` ADD CONSTRAINT `room_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `guild`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room` ADD CONSTRAINT `room_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_participant` ADD CONSTRAINT `room_participant_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_participant` ADD CONSTRAINT `room_participant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_view` ADD CONSTRAINT `room_view_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_view` ADD CONSTRAINT `room_view_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_settings` ADD CONSTRAINT `user_settings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


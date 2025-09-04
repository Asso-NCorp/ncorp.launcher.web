-- CreateTable
CREATE TABLE `guild` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `icon` TEXT NULL,
    `ownerId` VARCHAR(36) NOT NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `guild_slug_key`(`slug`),
    INDEX `guild_owner_FK`(`ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `guild_member` (
    `id` CHAR(36) NOT NULL,
    `guildId` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `nickname` VARCHAR(100) NULL,
    `roles` TEXT NULL,
    `joinedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `guild_member_guild_idx`(`guildId`),
    INDEX `guild_member_user_idx`(`userId`),
    UNIQUE INDEX `guild_member_unique`(`guildId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `channel` (
    `id` CHAR(36) NOT NULL,
    `guildId` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `type` ENUM('TEXT', 'VOICE', 'CATEGORY') NOT NULL DEFAULT 'TEXT',
    `topic` VARCHAR(500) NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `isPrivate` BOOLEAN NOT NULL DEFAULT false,
    `parentId` CHAR(36) NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `channel_guild_idx`(`guildId`),
    INDEX `channel_parent_idx`(`parentId`),
    UNIQUE INDEX `channel_slug_per_guild`(`guildId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `channel_member` (
    `channelId` CHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `addedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `channel_member_user_idx`(`userId`),
    PRIMARY KEY (`channelId`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room` (
    `id` CHAR(36) NOT NULL,
    `type` ENUM('DM', 'GROUP', 'GUILD_CHANNEL') NOT NULL,
    `name` VARCHAR(255) NULL,
    `ownerId` VARCHAR(36) NULL,
    `guildId` VARCHAR(36) NULL,
    `channelId` CHAR(36) NULL,
    `lastMessageAt` DATETIME(0) NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `room_type_idx`(`type`),
    INDEX `room_guild_idx`(`guildId`),
    INDEX `room_lastMessageAt_idx`(`lastMessageAt`),
    UNIQUE INDEX `room_unique_channel`(`channelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room_participant` (
    `roomId` CHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `joinedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `isMuted` BOOLEAN NOT NULL DEFAULT false,
    `isPinned` BOOLEAN NOT NULL DEFAULT false,

    INDEX `room_participant_user_idx`(`userId`),
    PRIMARY KEY (`roomId`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dm_pair_unique` (
    `id` CHAR(36) NOT NULL,
    `userA` VARCHAR(36) NOT NULL,
    `userB` VARCHAR(36) NOT NULL,
    `roomId` CHAR(36) NOT NULL,

    INDEX `dm_pair_room_idx`(`roomId`),
    UNIQUE INDEX `dm_pair_users_unique`(`userA`, `userB`),
    PRIMARY KEY (`id`)
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

    INDEX `message_room_created_id_idx`(`roomId`, `createdAt`, `id`),
    INDEX `message_author_created_idx`(`authorId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message_read` (
    `messageId` CHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `readAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `message_read_user_idx`(`userId`, `readAt`),
    PRIMARY KEY (`messageId`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message_reaction` (
    `messageId` CHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `emoji` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `message_reaction_user_idx`(`userId`),
    PRIMARY KEY (`messageId`, `userId`, `emoji`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room_view` (
    `roomId` CHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `lastSeenAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `room_view_user_idx`(`userId`, `lastSeenAt`),
    PRIMARY KEY (`roomId`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `guild` ADD CONSTRAINT `guild_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guild_member` ADD CONSTRAINT `guild_member_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `guild`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guild_member` ADD CONSTRAINT `guild_member_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `channel` ADD CONSTRAINT `channel_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `guild`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `channel` ADD CONSTRAINT `channel_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `channel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `channel_member` ADD CONSTRAINT `channel_member_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `channel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `channel_member` ADD CONSTRAINT `channel_member_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room` ADD CONSTRAINT `room_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room` ADD CONSTRAINT `room_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `guild`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room` ADD CONSTRAINT `room_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `channel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_participant` ADD CONSTRAINT `room_participant_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_participant` ADD CONSTRAINT `room_participant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dm_pair_unique` ADD CONSTRAINT `dm_pair_unique_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message` ADD CONSTRAINT `message_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message` ADD CONSTRAINT `message_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_read` ADD CONSTRAINT `message_read_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `message`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_read` ADD CONSTRAINT `message_read_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_reaction` ADD CONSTRAINT `message_reaction_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `message`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_reaction` ADD CONSTRAINT `message_reaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_view` ADD CONSTRAINT `room_view_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_view` ADD CONSTRAINT `room_view_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE `channel` DROP FOREIGN KEY `channel_guildId_fkey`;

-- DropForeignKey
ALTER TABLE `guild_member` DROP FOREIGN KEY `guild_member_guildId_fkey`;

-- DropForeignKey
ALTER TABLE `room` DROP FOREIGN KEY `room_guildId_fkey`;

-- AlterTable
ALTER TABLE `channel` MODIFY `guildId` CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE `guild_member` MODIFY `guildId` CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE `room` MODIFY `guildId` CHAR(36) NULL;

-- AddForeignKey
ALTER TABLE `guild_member` ADD CONSTRAINT `guild_member_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `guild`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `channel` ADD CONSTRAINT `channel_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `guild`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room` ADD CONSTRAINT `room_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `guild`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

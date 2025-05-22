/*
  Warnings:

  - You are about to drop the `game_playtime` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `game_playtime` DROP FOREIGN KEY `game_playtime_user_id_fkey`;

-- DropTable
DROP TABLE `game_playtime`;

-- CreateTable
CREATE TABLE `game_session` (
    `id` CHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `game_slug` VARCHAR(36) NOT NULL,
    `start_time` DATETIME(0) NOT NULL,
    `end_time` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `game_session` ADD CONSTRAINT `game_session_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

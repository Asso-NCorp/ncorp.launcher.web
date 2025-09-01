-- AlterTable
ALTER TABLE `user` MODIFY `role` VARCHAR(100) NOT NULL DEFAULT 'user';

-- CreateTable
CREATE TABLE `role` (
    `name` VARCHAR(100) NOT NULL,
    `avatar_decoration` TEXT NULL,
    `nameplate_decoration` TEXT NULL,

    UNIQUE INDEX `role_name_key`(`name`),
    PRIMARY KEY (`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

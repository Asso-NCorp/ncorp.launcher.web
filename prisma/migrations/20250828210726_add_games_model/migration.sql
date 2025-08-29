-- AlterTable
ALTER TABLE `user` ADD COLUMN `lastLogin` DATETIME(0) NULL;

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

    UNIQUE INDEX `game_folder_slug_key`(`folder_slug`),
    INDEX `game_user_created_FK`(`created_by`),
    INDEX `game_user_updated_FK`(`updated_by`),
    INDEX `game_folder_slug_IDX`(`folder_slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

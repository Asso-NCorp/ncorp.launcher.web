-- CreateTable
CREATE TABLE `game_server` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `game_slug` VARCHAR(100) NOT NULL,
    `game_title` VARCHAR(255) NOT NULL,
    `type` VARCHAR(10) NOT NULL,
    `port` INTEGER UNSIGNED NOT NULL,
    `description` TEXT NULL,
    `name` VARCHAR(255) NOT NULL,
    `monitor` BOOLEAN NOT NULL DEFAULT false,
    `last_detection_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_by` VARCHAR(36) NOT NULL,
    `updated_by` VARCHAR(36) NOT NULL,

    INDEX `game_server_game_slug_IDX`(`game_slug`),
    INDEX `game_server_created_by_IDX`(`created_by`),
    INDEX `game_server_updated_by_IDX`(`updated_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `game_server` ADD CONSTRAINT `game_server_created_by_FK` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `game_server` ADD CONSTRAINT `game_server_updated_by_FK` FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

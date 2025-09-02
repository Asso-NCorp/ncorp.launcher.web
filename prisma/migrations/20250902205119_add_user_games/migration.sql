-- CreateTable
CREATE TABLE `user_game` (
    `user_id` VARCHAR(36) NOT NULL,
    `game_slug` VARCHAR(100) NOT NULL,
    `installed_at` DATETIME(0) NULL,

    INDEX `user_game_user_id_FK`(`user_id`),
    INDEX `user_game_game_slug_FK`(`game_slug`),
    PRIMARY KEY (`user_id`, `game_slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

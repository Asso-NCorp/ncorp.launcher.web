-- CreateTable
CREATE TABLE `username_file_config` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `folder_slug` VARCHAR(100) NOT NULL,
    `path` VARCHAR(200) NOT NULL,
    `variable` VARCHAR(200) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

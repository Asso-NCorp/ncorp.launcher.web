-- CreateTable
CREATE TABLE `edition` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `startDate` DATETIME(0) NOT NULL,
    `endDate` DATETIME(0) NOT NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `createdBy` VARCHAR(36) NOT NULL,
    `updatedBy` VARCHAR(36) NOT NULL,

    INDEX `edition_created_by_FK`(`createdBy`),
    INDEX `edition_updated_by_FK`(`updatedBy`),
    INDEX `edition_start_date_IDX`(`startDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `edition_room` (
    `id` CHAR(36) NOT NULL,
    `editionId` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `edition_room_edition_idx`(`editionId`),
    UNIQUE INDEX `edition_room_unique_name`(`editionId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `table` (
    `id` CHAR(36) NOT NULL,
    `roomId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `positionX` INTEGER NOT NULL DEFAULT 0,
    `positionY` INTEGER NOT NULL DEFAULT 0,
    `width` INTEGER NOT NULL DEFAULT 2,
    `height` INTEGER NOT NULL DEFAULT 2,
    `capacity` INTEGER NOT NULL DEFAULT 8,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `table_room_idx`(`roomId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `table_seat` (
    `id` CHAR(36) NOT NULL,
    `tableId` CHAR(36) NOT NULL,
    `seatIndex` INTEGER NOT NULL,
    `userId` VARCHAR(36) NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `table_seat_table_idx`(`tableId`),
    INDEX `table_seat_user_idx`(`userId`),
    UNIQUE INDEX `table_seat_unique`(`tableId`, `seatIndex`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `edition` ADD CONSTRAINT `edition_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `edition` ADD CONSTRAINT `edition_updatedBy_fkey` FOREIGN KEY (`updatedBy`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `edition_room` ADD CONSTRAINT `edition_room_editionId_fkey` FOREIGN KEY (`editionId`) REFERENCES `edition`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `table` ADD CONSTRAINT `table_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `edition_room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `table_seat` ADD CONSTRAINT `table_seat_tableId_fkey` FOREIGN KEY (`tableId`) REFERENCES `table`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `table_seat` ADD CONSTRAINT `table_seat_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `approvedAt` DATETIME(0) NULL,
    ADD COLUMN `approvedBy` VARCHAR(36) NULL;

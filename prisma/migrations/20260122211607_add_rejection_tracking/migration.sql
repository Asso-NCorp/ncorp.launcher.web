-- AlterTable
ALTER TABLE `user` ADD COLUMN `rejectedAt` DATETIME(0) NULL,
    ADD COLUMN `rejectedBy` VARCHAR(36) NULL;

/*
  Warnings:

  - You are about to drop the column `nameplate_decoration` on the `role` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `role` DROP COLUMN `nameplate_decoration`,
    ADD COLUMN `nameplate_decoration_animated` TEXT NULL,
    ADD COLUMN `nameplate_decoration_static` TEXT NULL;

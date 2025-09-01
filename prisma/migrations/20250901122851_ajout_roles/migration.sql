/*
  Warnings:

  - You are about to drop the column `avatar_decoration` on the `role` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `role` DROP COLUMN `avatar_decoration`,
    ADD COLUMN `avatar_decoration_animated` TEXT NULL,
    ADD COLUMN `avatar_decoration_static` TEXT NULL;

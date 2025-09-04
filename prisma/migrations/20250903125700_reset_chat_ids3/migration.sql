/*
  Warnings:

  - The primary key for the `dm_pair_unique` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `dm_pair_unique` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.

*/
-- AlterTable
ALTER TABLE `dm_pair_unique` DROP PRIMARY KEY,
    MODIFY `id` CHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id`);

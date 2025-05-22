/*
  Warnings:

  - The primary key for the `game_playtime` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `session_id` on the `game_playtime` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `game_playtime` DROP PRIMARY KEY,
    DROP COLUMN `session_id`,
    MODIFY `id` CHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id`);

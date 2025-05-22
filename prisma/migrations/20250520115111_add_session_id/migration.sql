/*
  Warnings:

  - Added the required column `session_id` to the `game_playtime` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `game_playtime` ADD COLUMN `session_id` VARCHAR(36) NOT NULL;

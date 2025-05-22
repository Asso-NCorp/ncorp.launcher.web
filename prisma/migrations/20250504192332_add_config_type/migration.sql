/*
  Warnings:

  - Added the required column `config_type` to the `username_file_config` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `username_file_config` ADD COLUMN `config_type` VARCHAR(100) NOT NULL;

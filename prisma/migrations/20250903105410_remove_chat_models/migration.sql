/*
  Warnings:

  - You are about to drop the `chat_channel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chat_message` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chat_private_message` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chat_server` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `chat_channel` DROP FOREIGN KEY `chat_channel_chat_server_FK`;

-- DropForeignKey
ALTER TABLE `chat_message` DROP FOREIGN KEY `chat_messages_chat_channel_FK`;

-- DropForeignKey
ALTER TABLE `chat_message` DROP FOREIGN KEY `chat_messages_user_FK`;

-- DropForeignKey
ALTER TABLE `chat_private_message` DROP FOREIGN KEY `chat_private_message_user_FK`;

-- DropForeignKey
ALTER TABLE `chat_private_message` DROP FOREIGN KEY `chat_private_message_user_FK_1`;

-- DropTable
DROP TABLE `chat_channel`;

-- DropTable
DROP TABLE `chat_message`;

-- DropTable
DROP TABLE `chat_private_message`;

-- DropTable
DROP TABLE `chat_server`;

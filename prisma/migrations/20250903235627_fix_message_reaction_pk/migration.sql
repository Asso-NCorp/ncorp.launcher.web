-- CreateIndex
CREATE INDEX `IX_message_emoji` ON `message_reaction`(`messageId`, `emoji`);

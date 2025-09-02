-- CreateIndex
CREATE INDEX `user_game_slug_installed_at_idx` ON `user_game`(`game_slug`, `installed_at`);

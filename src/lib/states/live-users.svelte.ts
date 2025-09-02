import { logger } from "../stores/loggerStore";
import { getServerApi, syncArrayInPlace } from "../utils";
import { global } from "./global.svelte";
import type { LiveUser, UserActivity, UserConnectionType } from "$src/lib/shared-models";
import { GamesStore } from "./games.svelte";

class LiveUsers {
    updateUserDownloadSpeed(userId: string, slug: string, moPerSeconds: number, mbitsPerSeconds: number) {
        const user = this.getUser(userId);
        if (user) {
            user.downloadSpeedMegaBytesPerSecond = moPerSeconds;
            user.downloadSpeedMegabitsPerSecond = mbitsPerSeconds;
        }
    }
    users = $state<LiveUser[]>([]);
    loading = $state<boolean>(false);
    constructor() {}

    addUser(user: LiveUser) {
        this.users.push(user);
    }

    removeUser(userId: string) {
        this.users = this.users.filter((u) => u.id !== userId);
    }

    getUserCount(): number {
        return this.users.length;
    }

    clearUsers() {
        this.users = [];
    }

    userExists(userId: string): boolean {
        return this.users.some((u) => u.id === userId);
    }

    getUser(userId: string): LiveUser | undefined {
        return this.users.find((u) => u.id === userId);
    }

    updateUserAgentVersion(userId: string, agentVersion: string) {
        const user = this.getUser(userId);
        if (user) {
            logger.info(`User ${userId} agent version updated to ${agentVersion}`);
            user.agentVersion = agentVersion;
        } else {
            logger.info(`[updateUserAgentVersion] : User ${userId} not found.`);
        }
    }

    updateUserActivity(userId: string, activity: UserActivity) {
        const user = this.getUser(userId);
        if (user) {
            logger.info(`User ${userId} activity updated to ${activity}`);
            user.activity = activity;

            if (user.activity.activityType === "Idle") {
                user.downloadSpeedMegaBytesPerSecond = 0;
                user.downloadSpeedMegabitsPerSecond = 0;
                user.gameInstallProgress = 0;
            }

            if (userId == global.currentUser?.id) {
                if (user.activity.activityType == "Playing") {
                    if (GamesStore.has(user.activity.gameSlug!)) {
                        const game = GamesStore.get(user.activity.gameSlug!);
                        if (game) {
                            game.isPlaying = true;
                        }
                    }
                } else {
                    // Reset all games to not playing
                    GamesStore.resetGamesPlayingStates();
                }
            }
        } else {
            logger.info(`[updateUserActivity] : User ${userId} not found.`);
        }
    }

    updateUserGameProgress(gameSlug: string, userId: string, progress: number) {
        const user = this.getUser(userId);
        if (user) {
            user.gameInstallProgress = progress;
            if (user.activity) {
                user.activity.activityType = "Installing";
                user.activity.gameSlug = gameSlug;
            } else {
                user.activity = {
                    activityType: "Installing",
                    gameSlug: gameSlug,
                    gameTitle: GamesStore.get(gameSlug)?.title,
                };
            }

            if (progress >= 100) {
                user.gameInstallProgress = 0; // Reset progress when installation is complete
            }
        } else {
            logger.info(`[updateUserGameProgress] : User ${userId} not found.`);
        }
    }

    async updateUserStatus(userId: string, status: UserConnectionType) {
        let user = this.getUser(userId);
        if (user) {
            logger.info(`User ${userId} status updated to ${status}`);
            user.status = status;
        } else {
            const users = await getServerApi().getOnlineUsers();
            user = users.find((u) => u.id === userId);
            if (user) {
                if (this.getUser(userId)) {
                    this.removeUser(userId);
                }
                this.addUser(user);
                //logger.info(`User ${userId} status updated to ${status}`);
            } else {
                logger.info(`[updateUserStatus] : User ${userId} not found.`);
            }
        }
    }

    updateSpeakingStatus(userId: string, speaking: boolean) {
        const user = this.getUser(userId);
        if (user) {
            logger.info(`User ${userId} speaking status updated to ${speaking}`);
            user.isSpeaking = speaking;
        } else {
            logger.info(`[updateSpeakingStatus] : User ${userId} not found.`);
        }
    }

    refreshLiveUsers = async () => {
        if (this.loading) return;
        logger.info("Refreshing live users");
        try {
            liveUsers.loading = true;
            const users = await getServerApi().getOnlineUsers();
            syncArrayInPlace(liveUsers.users, users, (u) => u.id);
        } catch (error) {
            logger.error(`Error fetching live users: ${error}`);
        } finally {
            liveUsers.loading = false;
        }
    };

    currentUser = $derived(this.getUser(global.currentUser?.id));
}

export const liveUsers = new LiveUsers();
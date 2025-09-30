import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import * as signalR from '@microsoft/signalr';
import { GamesStore } from "./states/games.svelte";
import type { InstallableGame, LiveUser, UserActivity } from "./shared-models";

import { toast } from "svelte-sonner";
import { liveUsers } from "./states/live-users.svelte";
import { logger } from "./stores/loggerStore";
import { global } from "./states/global.svelte";
import type { liveAgentConnection } from "./states/live-agent.svelte";
import type { UserConnectionStatus } from "./shared-models/models/UserConnectionStatus";

// Options pour la fonction utilitaire
export interface SignalREventBinderOptions {
    showConfigGamesDirDialogSetter?: (v: boolean) => void;
    refreshSideLinks?: () => Promise<void>;
}

interface SignalRConnection {
    connection: signalR.HubConnection;
    connectionState: signalR.HubConnectionState;
    startConnection: () => Promise<void> | void;
    stopConnection?: () => Promise<void> | void;
    agentVersion?: string;
}

export class SignalREventBinder {
    static bindAllEvents(
        liveServerConnection: SignalRConnection,
        liveAgentConnection: SignalRConnection,
        options?: SignalREventBinderOptions,
    ) {
        if (!browser) return;

        // AGENT EVENTS
        this.offAndOn(liveAgentConnection, "TotalProgressChanged", (gameSlug: string, progress: number) => {
            GamesStore.setGameInstallProgress(gameSlug, progress);
        });

        this.offAndOn(liveAgentConnection, "NoGameConfig", (gameSlug: string) => {
            toast.warning(
                `Attention, la mise à jour du pseudo du jeu ${gameSlug} a échouée.\nVous devrez mettre à jour le pseudo manuellement.`,
            );
        });

        this.offAndOn(liveAgentConnection, "GameStatusChanged", (gameSlug: string, status: string) => {
            console.log(`Game status changed: ${gameSlug} is now ${status}`);
            GamesStore.setGameStatus(gameSlug, status);
        });

        this.offAndOn(liveAgentConnection, "GameInstalled", (gameSlug: string) => {
            toast.success(`Installation terminée : ${gameSlug}`, {
                action: {
                    label: "Voir",
                    onClick: () => goto(`/games/${gameSlug}`),
                },
            });
            GamesStore.setGameIsInstalled(gameSlug, true);
            GamesStore.setGameStatus(gameSlug, undefined);
            GamesStore.setGameETA(gameSlug, undefined);
            GamesStore.deselect(gameSlug);
        });

        this.offAndOn(liveAgentConnection, "GameEtaChanged", (gameSlug: string, eta: string) => {
            GamesStore.setGameETA(gameSlug, eta);
        });

        // SERVER EVENTS

        this.offAndOn(
            liveServerConnection,
            "UserGameProgressChanged",
            (userId: string, gameSlug: string, progress: number) => {
                liveUsers.updateUserGameProgress(gameSlug, userId, progress);
            },
        );

        this.offAndOn(liveServerConnection, "SetLocalGamesFolderValid", async (localGamesDir: string) => {
            if (!localGamesDir && options?.showConfigGamesDirDialogSetter) {
                options.showConfigGamesDirDialogSetter(true);
            } else {
                global.localGamesFolder = localGamesDir;
                logger.info("Local games folder set to: " + localGamesDir);
                if (GamesStore.games?.length === 0) {
                    await GamesStore.getAvailableGames();
                }
            }
        });

        this.offAndOn(
            liveServerConnection,
            "GameSpeedChanged",
            (userId: string, slug: string, payload: { moPerSeconds: number; mbitsPerSeconds: number }) => {
                liveUsers.updateUserDownloadSpeed(userId, slug, payload.moPerSeconds, payload.mbitsPerSeconds);
                if (userId === global.currentUser?.id) {
                    let game = GamesStore.get(slug);
                    if (game) {
                        game.isInstalling = true;
                    }
                }
            },
        );

        this.offAndOn(liveServerConnection, "GamesListUpdated", async () => {
            await GamesStore.getAvailableGames();
        });

        this.offAndOn(liveServerConnection, "DesktopNotification", async (title: string, message: string) => {
            toast.info(title, {
                richColors: false,
                description: message,
                duration: 10000,
            })
        });

        this.offAndOn(liveServerConnection, "UserFinishedInstalling", (userId: string, gameSlug: string) => {
            if (userId === global.currentUser?.id) {
                let game = GamesStore.get(gameSlug);
                if (game) {
                    game.isInstalling = false;
                }
            }
        });

        this.offAndOn(liveServerConnection, "UserCancelledInstallation", (userId: string, gameSlug: string) => {
            let user = liveUsers.getUser(userId);
            if (!user) return;

            if (user.activity) {
                user.activity.gameSlug = undefined;
                user.activity.gameTitle = undefined;
                user.activity.activityType = "Idle";
            }
            user.gameInstallProgress = 0;
            user.downloadSpeedMegaBytesPerSecond = 0;
            user.downloadSpeedMegabitsPerSecond = 0;

            if (user.id === global.currentUser?.id) {
                let game = GamesStore.get(gameSlug);
                if (game) {
                    game.isInstalling = false;
                    game.installProgress = 0;
                    game.isLoading = false;
                    game.isCancellingInstall = false;
                    game.eta = undefined;
                }
            }
        });

        this.offAndOn(liveServerConnection, "UserActivityChanged", (userId: string, activity: UserActivity) => {
            liveUsers.updateUserActivity(userId, activity);
        });

        this.offAndOn(liveServerConnection, "GameExited", (userId: string, game: InstallableGame) => {
            GamesStore.setGamePlayingState(userId, game.folderSlug!, false);
        });

        this.offAndOn(liveServerConnection, "GameStarted", (userId: string, game: InstallableGame) => {
            GamesStore.setGamePlayingState(userId, game.folderSlug!, true);
        });

        this.offAndOn(liveServerConnection, "ReceiveChatMessage", (game: InstallableGame, user: LiveUser) => {
            logger.info({ game, user });
        });

        this.offAndOn(liveServerConnection, "SideLinksUpdated", async () => {
            await global.refreshSideLinks();
        });

        this.offAndOn(
            liveServerConnection,
            "UserStatusChanged",
            async (userId: string, status: UserConnectionStatus, agentVersion: string) => {
                await liveUsers.updateUserStatus(userId, status);
                liveUsers.updateUserAgentVersion(userId, agentVersion);
                if (userId === global.currentUser?.id) {
                    liveAgentConnection.agentVersion = agentVersion;
                }
            },
        );

        // Gestion reconnexion si besoin
        if (liveServerConnection.connectionState === signalR.HubConnectionState.Disconnected) {
            liveServerConnection.startConnection();
        }
        if (liveAgentConnection.connectionState === signalR.HubConnectionState.Disconnected) {
            liveAgentConnection.startConnection();
        }
    }

    // Utilitaire générique off+on
    private static offAndOn(conn: SignalRConnection, eventName: string, handler: (...args: never[]) => void) {
        conn.connection.off(eventName);
        conn.connection.on(eventName, handler);
    }
}
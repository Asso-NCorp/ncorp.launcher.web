import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import * as signalR from '@microsoft/signalr';
import { GamesStore } from './stores/games.svelte';
import { gameStatuses } from './stores/gameStatusesStore';
import type { InstallableGame, LiveUser, UserActivity, UserConnectionStatus } from './shared-models';
import { toast } from 'svelte-sonner';
import { liveUsers } from './states/live-users.svelte';
import { logger } from './stores/loggerStore';
import { global } from './states/global.svelte';

/// Types utilitaires (adapte si besoin)
export type SignalRConnection = {
    connection: signalR.HubConnection;
    connectionState: signalR.HubConnectionState;
    startConnection: () => Promise<void>;
};

// Options pour la fonction utilitaire
export interface SignalREventBinderOptions {
    showConfigGamesDirDialogSetter?: (v: boolean) => void;
    refreshSideLinks?: () => Promise<void>;
}

export class SignalREventBinder {
    static bindAllEvents(
        liveServerConnection: SignalRConnection,
        liveAgentConnection: SignalRConnection,
        options?: SignalREventBinderOptions
    ) {
        if (!browser) return;

        // AGENT EVENTS
        this.offAndOn(liveAgentConnection, "TotalProgressChanged", (gameSlug: string, progress: number) => {
            GamesStore.setGameInstallProgress(gameSlug, progress);
        });

        this.offAndOn(liveAgentConnection, "NoGameConfig", (gameSlug: string) => {
            toast.warning(
                `Attention, la mise à jour du pseudo du jeu ${gameSlug} a échouée.\nVous devrez mettre à jour le pseudo manuellement.`
            );
        });


        this.offAndOn(liveAgentConnection, "GameStatusChanged", (gameSlug: string, status: string) => {
            gameStatuses.update((words) => {
                words[gameSlug] = status;
                return { ...words };
            });
        });

        this.offAndOn(liveAgentConnection, "GameInstalled", (gameSlug: string) => {
            toast.success(`Installation terminée : ${gameSlug}`, {
                action: {
                    label: "Voir",
                    onClick: () => goto(`/games/${gameSlug}`),
                }
            });
            GamesStore.setGameIsInstalled(gameSlug, true);
            GamesStore.deselect(gameSlug);
        });

        // SERVER EVENTS

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

        this.offAndOn(liveServerConnection, "GamesListUpdated", async () => {
            await GamesStore.getAvailableGames();
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

        this.offAndOn(liveServerConnection, "UserStatusChanged", async (userId: string, status: UserConnectionStatus) => {
            await liveUsers.updateUserStatus(userId, status);
        });

        // Gestion reconnexion si besoin
        if (liveServerConnection.connectionState === signalR.HubConnectionState.Disconnected) {
            liveServerConnection.startConnection();
        }
        if (liveAgentConnection.connectionState === signalR.HubConnectionState.Disconnected) {
            liveAgentConnection.startConnection();
        }
    }

    // Utilitaire générique off+on
    private static offAndOn(
        conn: SignalRConnection,
        eventName: string,
        handler: (...args: never[]) => void
    ) {
        conn.connection.off(eventName);
        conn.connection.on(eventName, handler);
    }
}
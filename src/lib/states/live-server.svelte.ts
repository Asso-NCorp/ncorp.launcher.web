import * as signalR from "@microsoft/signalr";
import { PUBLIC_BACKEND_API_URL } from "$env/static/public";
import { browser } from "$app/environment";
import SignalRInfiniteRetryPolicy from "../misc/signalrInfiniteRetryPolicy";
import { logger } from "../stores/loggerStore";
import { authClient } from "../auth/client";
import { liveUsers } from "./live-users.svelte";
import { GamesStore } from "./games.svelte";

class SignalRAgent {
    connection: signalR.HubConnection;
    isConnected = $state(false);
    connectionState = $state<signalR.HubConnectionState>(signalR.HubConnectionState.Disconnected);

    constructor() {
        this.connection = this.createConnection();
        this.registerEvents();
    }

    private createConnection() {
        let token = "";
        if (browser && localStorage?.getItem("token")) {
            token = localStorage.getItem("token") || "";
        }

        return new signalR.HubConnectionBuilder()
            .withUrl(`${PUBLIC_BACKEND_API_URL}/server-live`, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .configureLogging(signalR.LogLevel.None)
            .withAutomaticReconnect(new SignalRInfiniteRetryPolicy())
            .build();
    }

    private registerEvents() {
        this.connection.onreconnected(async () => {
            console.log("SignalR Server reconnected");
            this.isConnected = true;
            this.connectionState = this.connection.state;
            const currentUser = await authClient.getSession();
            if (currentUser) {
                GamesStore.resetGamePlayingState(currentUser.data!.user!.id!);
            }

            await GamesStore.getAvailableGames();
            await liveUsers.refreshLiveUsers();
        });

        this.connection.onreconnecting(() => {
            console.log("SignalR Server reconnecting");
            this.isConnected = false;
            this.connectionState = this.connection.state;
        });

        this.connection.onclose(() => {
            console.log("SignalR Server connection closed");
            this.isConnected = false;
            this.connectionState = this.connection.state;
        });
    }

    async startConnection() {
        logger.info("Starting SignalR Server connection");
        while (this.connection.state === signalR.HubConnectionState.Disconnected) {
            try {
                await this.connection.start();
                this.isConnected = true;
                this.connectionState = this.connection.state;
                await liveUsers.refreshLiveUsers();
                logger.info("[SignalR - Server] Getting available games");
                await GamesStore.getAvailableGames();
                break;
            } catch {
                console.log("SignalR Server connection failed. Retrying in 5 seconds");
                await new Promise((resolve) => setTimeout(resolve, 5000));
            }
        }
    }

    async stopConnection() {
        logger.info("Stopping SignalR Server connection");
        await this.connection.stop();
        this.isConnected = false;
        this.connectionState = this.connection.state;
    }

    async broadcastMessage(func: string, ...args: unknown[]): Promise<void> {
        if (!this.isConnected) return;
        if (args.length === 0) await this.connection.invoke(func);
        else await this.connection.invoke(func, ...args);
    }
}

export const liveServerConnection = new SignalRAgent();

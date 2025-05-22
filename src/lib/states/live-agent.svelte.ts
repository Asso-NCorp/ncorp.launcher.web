import * as signalR from '@microsoft/signalr';
import { PUBLIC_AGENT_URL } from '$env/static/public';
import { browser } from '$app/environment';
import SignalRInfiniteRetryPolicy from '../misc/signalrInfiniteRetryPolicy';
import { logger } from '../stores/loggerStore';

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
        if (browser && localStorage?.getItem('token')) {
            token = localStorage.getItem('token') || "";
        }

        return new signalR.HubConnectionBuilder()
            .withUrl(`${PUBLIC_AGENT_URL}/agent-live`, {
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .configureLogging(signalR.LogLevel.None)
            .withAutomaticReconnect(new SignalRInfiniteRetryPolicy())
            .build();
    }

    private registerEvents() {
        this.connection.onreconnected(async () => {
            console.log('SignalR Agent reconnected');
            this.isConnected = true;
            this.connectionState = this.connection.state;
            //await GamesStore.getAvailableGames();
        });

        this.connection.onreconnecting(() => {
            console.log('SignalR Agent reconnecting');
            this.isConnected = false;
            this.connectionState = this.connection.state;
        });

        this.connection.onclose(() => {
            console.log('SignalR Agent connection closed');
            this.isConnected = false;
            this.connectionState = this.connection.state;
        });

    }


    async startConnection() {
        logger.info('Starting SignalR Agent connection');
        while (this.connection.state === signalR.HubConnectionState.Disconnected) {
            try {
                await this.connection.start();
                console.log('SignalR Agent connected');
                this.isConnected = true;
                this.connectionState = this.connection.state;
                //await GamesStore.getAvailableGames();
                break;
            } catch {
                console.log("Trying to reconnect to SignalR Agent");
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    async stopConnection() {
        logger.info('Stopping SignalR Agent connection');
        await this.connection.stop();
        this.isConnected = false;
        this.connectionState = this.connection.state;
    }
}

export const liveAgentConnection = new SignalRAgent();

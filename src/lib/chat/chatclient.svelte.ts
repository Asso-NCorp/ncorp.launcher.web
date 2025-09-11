import * as signalR from "@microsoft/signalr";
import { browser } from "$app/environment";
import type { MessageDto, MessagePage, PageCursor, RoomDto } from "../shared-models";
import { PUBLIC_BACKEND_API_URL } from "$env/static/public";

const HUB_URL = `${PUBLIC_BACKEND_API_URL}/chat-live`; // SignalR hub

class ChatClient {
    connection: signalR.HubConnection | null = null;

    async connect(getToken?: () => string | Promise<string>) {
        if (!browser || this.connection?.state === "Connected") return;

        console.log(HUB_URL);

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL, {
                withCredentials: true,
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.None)
            .build();

        await this.connection.start();
    }

    on<T>(event: string, cb: (payload: T) => void) {
        this.connection?.on(event, cb);
    }

    off(event: string, cb?: (...a: any[]) => void) {
        if (!this.connection) return;
        cb ? this.connection.off(event, cb) : this.connection.off(event);
    }

    invoke<T = any>(method: string, ...args: any[]) {
        return this.connection!.invoke<T>(method, ...args);
    }

    joinRoom(roomId: string) {
        return this.invoke("JoinRoom", roomId);
    }
    leaveRoom(roomId: string) {
        return this.invoke("LeaveRoom", roomId);
    }

    myRooms() {
        return this.invoke<RoomDto[]>("MyRooms");
    }

    fetchMessages(roomId: string, take = 50, after?: PageCursor | null) {
        return this.invoke<MessagePage>("FetchMessages", roomId, take, after ?? null);
    }

    sendMessage(roomId: string, content: string) {
        return this.invoke<MessageDto>("SendMessage", { roomId, content, type: "TEXT" });
    }

    deleteMessage(messageId: string) {
        return this.invoke("DeleteMessage", messageId);
    }

    typing(roomId: string, isTyping: boolean) {
        return this.invoke("Typing", roomId, isTyping);
    }

    read(roomId: string, messageId: string) {
        return this.invoke("Read", roomId, messageId);
    }

    react(roomId: string, messageId: string, emoji: string) {
        // Appelle le Hub.Chat.React(ReactRequest)
        return this.invoke("React", { roomId, messageId, emoji });
    }
}

export const chatClient = new ChatClient();

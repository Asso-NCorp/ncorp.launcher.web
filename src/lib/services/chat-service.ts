// Placeholder service functions. Replace with real HTTP / SignalR implementations.

import type { ChatMessage } from "$lib/states/chat.svelte";

export async function fetchServers() {
    // return await api.get("/chat/servers");
    return [];
}

export async function fetchChannels(serverId: string) {
    return [];
}

export async function fetchChannelHistory(channelId: string) {
    return [] as ChatMessage[];
}

export async function postChannelMessage(channelId: string, content: string) {
    return {
        id: crypto.randomUUID(),
        channel_id: channelId,
        author_id: "me",
        author_name: "Moi",
        content,
        created_at: new Date().toISOString(),
    } satisfies ChatMessage;
}

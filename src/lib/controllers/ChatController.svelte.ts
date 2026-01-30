import { chatStore } from "$lib/chat/chat.svelte";
import { chatNotifications } from "$lib/states/chat-notifications.svelte";
import { liveUsers } from "$lib/states/live-users.svelte";
import { global } from "$lib/states/global.svelte";
import type { ServerItemData, ChannelItemData } from "$lib/types";
import type { RoomDto } from "$lib/shared-models";
import { goto } from "$app/navigation";

export interface ChatContextState {
    selectedServerId: string | null;
    selectedChannelId: string | null;
    servers: ServerItemData[];
    channels: ChannelItemData[];
}

class ChatControllerImpl {
    // UI State
    contextState: ChatContextState = $state({
        selectedServerId: null,
        selectedChannelId: null,
        servers: [],
        channels: [],
    });

    // Derived states
    get currentRoom() {
        return chatStore.rooms.find((r) => r.id === this.contextState.selectedChannelId);
    }

    get isInDMContext() {
        return this.contextState.selectedServerId === "dm_server";
    }

    /**
     * Initialize the controller - call once on mount
     */
    async init() {
        // Chat store is now initialized globally in the authenticated layout
        // Just rebuild the server list from current rooms
        this.rebuildServerList();
    }

    /**
     * Rebuild server list from current rooms
     */
    rebuildServerList() {
        const rooms = chatStore.rooms;
        const byGuild = new Map<string, { name: string; icon?: string | null }>();

        for (const r of rooms) {
            if (r.type === "GUILD_CHANNEL" && r.guildId) {
                if (!byGuild.has(r.guildId)) {
                    byGuild.set(r.guildId, { name: "Serveur", icon: null });
                }
            }
        }

        const dmServer: ServerItemData = {
            id: "dm_server",
            name: "Message privés",
            icon: null,
            iconName: "mail",
            active: false,
            unread: false,
        };

        const guildServers = Array.from(byGuild.entries()).map(([id, g]) => ({
            id,
            name: g.name,
            icon: g.icon,
            active: false,
            unread: false,
        }));

        this.contextState.servers = [dmServer, ...guildServers];
    }

    /**
     * Check if a string looks like a GUID
     */
    private isGUID(str: string): boolean {
        try {
            return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        } catch {
            return false;
        }
    }

    /**
     * Get display name for a DM room
     */
    private getDMDisplayName(room: RoomDto): string {
        try {
            const currentUserId = global.currentUser?.id;

            // First, try to use room.name if it exists
            if (room.name && room.name.length > 0 && !this.isGUID(room.name)) {
                return room.name;
            }

            // If participantIds is available, find the OTHER user (not current)
            if (room.participantIds && room.participantIds.length > 0) {
                for (const userId of room.participantIds) {
                    // Skip current user
                    if (currentUserId && userId === currentUserId) continue;

                    const user = liveUsers.users.find((u) => u.id === userId);
                    if (user?.name) {
                        return user.name;
                    }
                }
            }

            // Fallback: try room.name as a GUID and look it up
            if (room.name && this.isGUID(room.name)) {
                const user = liveUsers.users.find((u) => u.id === room.name);
                if (user?.name) {
                    return user.name;
                }
            }
        } catch (error) {
            console.warn("[getDMDisplayName] Error:", error);
        }

        return "Conversation privée";
    }

    /**
     * Get avatar URL for DM user (same as shown in LiveUserRow)
     */
    private getDMUserAvatar(room: RoomDto): string | undefined {
        try {
            const currentUserId = global.currentUser?.id;

            // Use participantIds if available, find the OTHER user (not current)
            if (room.participantIds && room.participantIds.length > 0) {
                for (const userId of room.participantIds) {
                    // Skip current user
                    if (currentUserId && userId === currentUserId) continue;

                    // Find the user in liveUsers and return their avatar image
                    const user = liveUsers.users.find((u) => u.id === userId);
                    if (user && user.image) {
                        return user.image;
                    }
                }
            }

            // Fallback: try room.name as a GUID
            if (room.name && this.isGUID(room.name)) {
                const userById = liveUsers.users.find((u) => u.id === room.name);
                if (userById?.image) {
                    return userById.image;
                }
            }
        } catch (error) {
            console.warn("[getDMUserAvatar] Error:", error);
        }

        return undefined;
    }

    /**
     * Select a server and update the channel list
     */
    selectServer(serverId: string) {
        try {
            // Clear current selection to clean up ChatPane
            this.clearCurrentRoom();

            this.contextState.selectedServerId = serverId;

            if (serverId === "dm_server") {
                // Show DM and group channels, sorted by last message time
                const dmAndGroups = chatStore.rooms.filter((r) => r.type !== "GUILD_CHANNEL");
                this.contextState.channels = dmAndGroups
                    .sort((a, b) => {
                        // Sort by lastMessageAt descending (most recent first)
                        const aTime = new Date(a.lastMessageAt || 0).getTime();
                        const bTime = new Date(b.lastMessageAt || 0).getTime();
                        return bTime - aTime;
                    })
                    .map((r) => {
                        try {
                            return {
                                id: r.id ?? "",
                                type: r.type === "DM" ? ("direct" as const) : ("group" as const),
                                name: r.type === "DM" ? this.getDMDisplayName(r) : (r.name ?? "Groupe"),
                                avatarUrl: r.type === "DM" ? this.getDMUserAvatar(r) : undefined,
                            };
                        } catch (error) {
                            console.error("[selectServer] Error mapping room:", r, error);
                            return {
                                id: r.id ?? "",
                                type: r.type === "DM" ? ("direct" as const) : ("group" as const),
                                name: r.name ?? (r.type === "DM" ? "Conversation privée" : "Groupe"),
                                avatarUrl: undefined,
                            };
                        }
                    });
            } else {
                // Show guild channels for selected server
                const list = chatStore.rooms.filter((r) => r.type === "GUILD_CHANNEL" && r.guildId === serverId);
                this.contextState.channels = list.map((r) => ({
                    id: r.id ?? "",
                    type: "direct" as const,
                    name: r.name ?? "channel",
                }));
            }

            // Persist last selected server
            try {
                localStorage.setItem("chat:lastServerId", serverId);
            } catch {}
        } catch (error) {
            console.error("[selectServer] Fatal error:", error);
            // Ensure channels array is not undefined
            this.contextState.channels = [];
        }
    }
    async selectChannelInternal(channelId: string) {
        this.contextState.selectedChannelId = channelId;

        // Clear notification for this channel
        chatNotifications.clearNotification(channelId);

        // Select room in chat store
        await chatStore.selectRoom(channelId);

        // Persist last selected channel
        try {
            localStorage.setItem("chat:lastChannelId", channelId);
        } catch {}
    }

    /**
     * Select a channel and join the room (with navigation)
     */
    async selectChannel(channelId: string) {
        await this.selectChannelInternal(channelId);

        // Navigate to the appropriate route
        if (this.isInDMContext) {
            await goto(`/chat/channels/@me/${channelId}`);
        } else if (this.contextState.selectedServerId) {
            await goto(`/chat/channels/${this.contextState.selectedServerId}/${channelId}`);
        }
    }

    /**
     * Clear current room selection (for cleanup when switching servers)
     */
    private clearCurrentRoom() {
        this.contextState.selectedChannelId = null;
        chatStore.currentRoomId = null;
    }

    /**
     * Get the title for the current selection
     */
    get currentTitle(): string {
        if (!this.contextState.selectedChannelId) return "";
        const room = chatStore.rooms.find((r) => r.id === this.contextState.selectedChannelId);
        return room?.name ?? "";
    }

    /**
     * Get all unread channels for current server
     */
    get unreadChannels(): string[] {
        return Array.from(chatNotifications.unreadChannels).filter((channelId) => {
            if (this.isInDMContext) {
                return !chatStore.rooms.find((r) => r.id === channelId && r.type === "GUILD_CHANNEL");
            } else {
                const room = chatStore.rooms.find((r) => r.id === channelId);
                return room?.guildId === this.contextState.selectedServerId;
            }
        });
    }

    /**
     * Restore last selection from localStorage
     */
    restoreLastSelection() {
        try {
            const lastServerId = localStorage.getItem("chat:lastServerId");
            const lastChannelId = localStorage.getItem("chat:lastChannelId");

            if (lastServerId && this.contextState.servers.some((s) => s.id === lastServerId)) {
                this.selectServer(lastServerId);

                if (lastChannelId && this.contextState.channels.some((c) => c.id === lastChannelId)) {
                    this.selectChannel(lastChannelId);
                }
            } else if (this.contextState.servers.length > 0) {
                this.selectServer(this.contextState.servers[0].id);
            }
        } catch {}
    }

    /**
     * Sync with chatStore when rooms change
     */
    syncWithStore() {
        this.rebuildServerList();

        // If current server is no longer in list, switch to first
        if (
            this.contextState.selectedServerId &&
            !this.contextState.servers.some((s) => s.id === this.contextState.selectedServerId)
        ) {
            if (this.contextState.servers.length > 0) {
                this.selectServer(this.contextState.servers[0].id);
            } else {
                this.clearCurrentRoom();
            }
        } else if (this.contextState.selectedServerId) {
            // Refresh channel list for current server (important for DM updates)
            this.selectServer(this.contextState.selectedServerId);
        }
    }

    /**
     * Send typing notification to SignalR server
     * Call this on user input with throttling
     */
    setTyping(isTyping: boolean) {
        if (!this.contextState.selectedChannelId) return;
        chatStore.setTyping(isTyping);
    }
}

export const chatController = new ChatControllerImpl();

import { browser } from "$app/environment";
import type { ChatServer, ChatChannel, ChatMessage, DirectConversation } from "./chat.types";

export const DM_SERVER_ID = "_dms"; // Pseudo serveur pour les messages privés

class _ChatStore {
    servers = $state<ChatServer[]>([]);
    channelsByServer = $state<Record<string, ChatChannel[]>>({});
    messagesByChannel = $state<Record<string, ChatMessage[]>>({});
    dms = $state<DirectConversation[]>([]);
    dmMessages = $state<Record<string, ChatMessage[]>>({});
    activeServerId = $state<string | null>(null);
    activeChannelId = $state<string | null>(null);
    activeDMId = $state<string | null>(null);
    isLoading = $state(false);
    connecting = $state(false);
    connected = $state(false);
    lastError = $state<string | null>(null);
    initialized = $state(false); // NEW: prevent double init

    get activeServer() {
        return this.servers.find((s) => s.id === this.activeServerId) || null;
    }
    get activeChannel(): ChatChannel | null {
        if (this.activeServerId === DM_SERVER_ID) return null;
        if (!this.activeServerId || !this.activeChannelId) return null;
        return (this.channelsByServer[this.activeServerId] || []).find((c) => c.id === this.activeChannelId) || null;
    }
    get activeMessages(): ChatMessage[] {
        if (this.activeChannelId) return this.messagesByChannel[this.activeChannelId] || [];
        if (this.activeDMId) return this.dmMessages[this.activeDMId] || [];
        return [];
    }

    async init() {
        if (this.initialized) return;
        this.initialized = true;
        await this.loadServers();
        this.ensureDmServer(); // ensure DM server exists (now appended)
        let storedServer: string | null = null;
        let storedChannel: string | null = null;
        if (browser) {
            storedServer = localStorage.getItem("chat:lastServer");
            storedChannel = localStorage.getItem("chat:lastChannel");
        }

        const firstNonDm = this.servers.find((s) => s.id !== DM_SERVER_ID) || null;

        if (storedServer && this.servers.some((s) => s.id === storedServer)) {
            this.selectServer(storedServer);
            if (storedChannel) {
                await this.loadChannels(storedServer);
                if ((this.channelsByServer[storedServer] || []).some((c) => c.id === storedChannel)) {
                    this.selectChannel(storedChannel);
                }
            }
        } else if (firstNonDm) {
            this.selectServer(firstNonDm.id);
        } else if (this.servers[0]) {
            // fallback (could be DM server only)
            this.selectServer(this.servers[0].id);
        }

        if (this.activeServerId === DM_SERVER_ID && browser) {
            const lastDM = localStorage.getItem("chat:lastDM");
            if (lastDM) this.selectDM(lastDM);
        }
    }

    ensureDmServer() {
        if (!this.servers.find((s) => s.id === DM_SERVER_ID)) {
            // APPEND instead of prepend so a real server can become default
            this.servers = [...this.servers, { id: DM_SERVER_ID, name: "MP" }];
        }
    }

    async loadServers() {
        this.isLoading = true;
        try {
            // TODO: replace with real API
            this.servers = [{ id: "nlan8", name: "NLAN8" }];
            // DM server appended later
        } finally {
            this.isLoading = false;
        }
    }

    async loadChannels(serverId: string) {
        if (this.channelsByServer[serverId]) return;
        // TODO: replace with real API
        this.channelsByServer[serverId] = [
            { id: `${serverId}-chat`, server_id: serverId, name: "discussion", type: "text" },
        ];
    }

    selectServer(serverId: string) {
        this.activeServerId = serverId;
        if (serverId === DM_SERVER_ID) {
            // Switching to DM “server” – clear channel selection
            this.activeChannelId = null;
        } else {
            this.activeDMId = null;
            this.ensureFirstTextChannel(serverId);
        }
        if (browser) localStorage.setItem("chat:lastServer", serverId);
    }

    private ensureFirstTextChannel(serverId: string) {
        const list = this.channelsByServer[serverId];
        if (!list) {
            this.loadChannels(serverId).then(() => this.ensureFirstTextChannel(serverId));
            return;
        }
        const firstText = list.find((c) => c.type === "text");
        if (firstText) this.activeChannelId = firstText.id;
    }

    selectChannel(channelId: string) {
        this.activeChannelId = channelId;
        this.activeDMId = null;
        if (!this.messagesByChannel[channelId]) {
            this.messagesByChannel[channelId] = [];
            this.fetchHistory(channelId);
        }
        if (browser) localStorage.setItem("chat:lastChannel", channelId);
    }

    selectDM(dmId: string) {
        this.ensureDmServer();
        // Force server context to DM pseudo server
        if (this.activeServerId !== DM_SERVER_ID) {
            this.activeServerId = DM_SERVER_ID;
            this.activeChannelId = null;
        }
        this.activeDMId = dmId;
        if (!this.dmMessages[dmId]) {
            this.dmMessages[dmId] = [];
            // TODO: fetch DM history
        }
        if (browser) localStorage.setItem("chat:lastDM", dmId);
    }

    async fetchHistory(channelId: string) {
        // TODO: real API
        this.messagesByChannel[channelId] = [
            {
                id: crypto.randomUUID(),
                channel_id: channelId,
                author_id: "system",
                author_name: "System",
                content: "Historique chargé.",
                created_at: new Date().toISOString(),
            },
        ];
    }

    private async prepareDefaultChannel() {
        // If a DM context is intended we do nothing here.
        if (this.activeDMId) return;
        // Try to ensure a server & its first channel exist.
        if (!this.activeServerId && this.servers.length) {
            // Pick first non-DM server if possible
            const firstNonDm = this.servers.find((s) => s.id !== DM_SERVER_ID) || this.servers[0];
            this.activeServerId = firstNonDm.id;
        }
        if (this.activeServerId && this.activeServerId !== DM_SERVER_ID) {
            if (!this.channelsByServer[this.activeServerId]) {
                await this.loadChannels(this.activeServerId);
            }
            if (!this.activeChannelId) {
                const firstText = (this.channelsByServer[this.activeServerId] || []).find((c) => c.type === "text");
                if (firstText) {
                    this.activeChannelId = firstText.id;
                }
            }
            // Still nothing? Create a local ephemeral text channel.
            if (!this.activeChannelId) {
                const ephemeralId = `${this.activeServerId}-local`;
                const channel: ChatChannel = {
                    id: ephemeralId,
                    server_id: this.activeServerId,
                    name: "local",
                    type: "text",
                };
                this.channelsByServer[this.activeServerId] = [
                    ...(this.channelsByServer[this.activeServerId] || []),
                    channel,
                ];
                this.activeChannelId = ephemeralId;
            }
        }
    }

    sendMessage = async (raw: string) => {
        const content = raw.trim();
        if (!content) return;
        const now = new Date().toISOString();

        // Ensure we have a valid target (channel or DM). If none, create/select one.
        if (!this.activeChannelId && !this.activeDMId) {
            await this.prepareDefaultChannel();
        }

        if (this.activeChannelId) {
            const channelId = this.activeChannelId;
            const tempId = crypto.randomUUID();
            const optimistic: ChatMessage = {
                id: tempId,
                channel_id: channelId,
                author_id: "me",
                author_name: "Moi",
                content,
                created_at: now,
                temp: true,
            };
            this.messagesByChannel[channelId] = [...(this.messagesByChannel[channelId] || []), optimistic];
            try {
                await new Promise((r) => setTimeout(r, 150)); // faster local feel
                this.replaceTempMessage(channelId, tempId, {
                    ...optimistic,
                    id: crypto.randomUUID(),
                    temp: false,
                });
            } catch {
                this.lastError = "Echec envoi message";
                this.messagesByChannel[channelId] = this.messagesByChannel[channelId].filter((m) => m.id !== tempId);
            }
        } else if (this.activeDMId) {
            // NEW: optimistic DM send
            const dmId = this.activeDMId;
            const tempId = crypto.randomUUID();
            const optimistic: ChatMessage = {
                id: tempId,
                channel_id: "", // not used for DM
                dm_id: dmId,
                author_id: "me",
                author_name: "Moi",
                content,
                created_at: now,
                temp: true,
            };
            this.dmMessages[dmId] = [...(this.dmMessages[dmId] || []), optimistic];
            try {
                await new Promise((r) => setTimeout(r, 150));
                this.dmMessages[dmId] = this.dmMessages[dmId].map((m) =>
                    m.id === tempId ? { ...m, id: crypto.randomUUID(), temp: false } : m,
                );
            } catch {
                this.lastError = "Echec envoi message";
                this.dmMessages[dmId] = this.dmMessages[dmId].filter((m) => m.id !== tempId);
            }
        }
    };

    private replaceTempMessage(channelId: string, tempId: string, finalMsg: ChatMessage) {
        this.messagesByChannel[channelId] = this.messagesByChannel[channelId].map((m) =>
            m.id === tempId ? finalMsg : m,
        );
    }

    receiveMessage(msg: ChatMessage) {
        if (msg.dm_id) {
            this.dmMessages[msg.dm_id] = [...(this.dmMessages[msg.dm_id] || []), msg];
            return;
        }
        if (msg.channel_id) {
            this.messagesByChannel[msg.channel_id] = [...(this.messagesByChannel[msg.channel_id] || []), msg];
        }
    }

    // Stubs for realtime
    async connectRealtime() {
        if (this.connected || this.connecting) return;
        this.connecting = true;
        try {
            // TODO: bind SignalR: connection.on("ChatMessage", (payload) => this.receiveMessage(payload));
            this.connected = true;
        } finally {
            this.connecting = false;
        }
    }
}

export const ChatStore = new _ChatStore();

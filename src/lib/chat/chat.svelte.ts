import type { MessageDto, MessagePage, PageCursor, ReactionDeltaDto, RoomDto } from "$lib/shared-models";
import { toast } from "svelte-sonner";
import { chatClient } from "./chatclient.svelte";
import { chatNotifications } from "$lib/states/chat-notifications.svelte";
import { liveUsers } from "$lib/states/live-users.svelte";

/**
 * Chat store: fixes and guards added to prevent TypeScript errors and runtime crashes.
 * - Replaced `import type` to be compatible with parsers that don't support it.
 * - Added null/undefined guards wherever external data may be missing.
 * - Defensive handling of reaction deltas and message pages.
 */

const LAST_ROOM_KEY = "chat:lastRoomId";
const LAST_SELECTION_KEY = "chat:lastSelection";
const LAST_SERVER_KEY = "chat:lastServerId";
const LAST_ROOM_BY_SERVER_PREFIX = "chat:lastRoomByServer:";

const TYPING_THROTTLE_MS = 700; // min between two "true"
const TYPING_STOP_MS = 3000; // send "false" after 3s without typing

class ChatStore {
    rooms: RoomDto[] = $state([]);
    currentRoomId: string | null = $state(null);
    loadingRooms = $state(false);

    messagesByRoom = $state<Record<string, MessageDto[]>>({});
    cursorsByRoom = $state<Record<string, PageCursor | null>>({});
    loadingMoreByRoom = $state<Record<string, boolean>>({});
    idsByRoom = $state<Record<string, Set<string>>>({});

    // roomId -> Map<userId, expireAtMs>
    typingUsers = $state<Record<string, Map<string, number>>>({});

    // Track DM participants: roomId -> otherUserId
    dmParticipants = $state<Record<string, string>>({});

    // ---- internal typing state (throttle + debounce) ----
    private typingState = {
        isTyping: false,
        lastTrueAt: 0,
        roomId: null as string | null,
        stopTimer: null as ReturnType<typeof setTimeout> | null,
        lastActivityAt: 0, // last keystroke timestamp
    };

    private pendingServerId: string | null = null;
    private resolvingPending = false;
    private typingPurgeInterval: ReturnType<typeof setInterval> | null = null;

    private getUserDisplayName(userId?: string | null) {
        const id = userId ?? "";
        const u = id ? liveUsers.getUser(id) : undefined;
        // Some LiveUser shapes may not have `username` - try several properties safely
        const name = u && ((u as any).username ?? (u as any).name ?? (u as any).displayName);
        return name || `User-${(userId ?? "unknown").substring(0, 8)}`;
    }

    private upsert(roomId: string, msg: MessageDto) {
        // Defensive guards
        if (!msg || !msg.id) {
            console.warn("[upsert] Ignoring invalid message", msg);
            return;
        }
        console.log(
            "[upsert] Received message in room:",
            roomId,
            "currentRoomId:",
            this.currentRoomId,
            "from:",
            msg.authorId,
        );

        const ids = this.idsByRoom[roomId] ?? new Set<string>();
        const list = this.messagesByRoom[roomId] ?? [];
        if (ids.has(msg.id)) {
            const i = list.findIndex((x) => x.id === msg.id);
            if (i !== -1) list[i] = msg;
            this.messagesByRoom[roomId] = [...list];
            return;
        }
        // Prepend (messages are stored DESC - newest first)
        this.messagesByRoom[roomId] = [msg, ...list];
        ids.add(msg.id);
        this.idsByRoom[roomId] = ids;

        // If the room doesn't exist in our list, refresh rooms in background
        if (!this.rooms.some((r) => r.id === roomId)) {
            console.log("[upsert] Room not found, refreshing rooms list in background");
            // fire-and-forget
            void this.refreshRooms();
        }

        // Trigger notification for incoming message if not in current room
        if (roomId !== this.currentRoomId) {
            console.log("[upsert] Showing notification (not in current room)");

            // Get room info (safely)
            const room = this.rooms.find((r) => r.id === roomId);
            let roomName: string | undefined = room?.name ?? undefined;

            // For DMs, try to construct name from participants
            if (!roomName && room?.type === "DM" && Array.isArray(room.participantIds)) {
                const otherUserIds = room.participantIds.filter((id) => id !== msg.authorId);
                if (otherUserIds.length > 0) {
                    const otherUser = liveUsers.getUser(otherUserIds[0]);
                    roomName = (otherUser && ((otherUser as any).username ?? (otherUser as any).name)) ?? undefined;
                }
            }

            // Fallback to truncated ID if no name found
            roomName = roomName || `Chat-${roomId?.substring(0, 8)}`;

            // Get author name from liveUsers with safe fallback
            const authorName = this.getUserDisplayName(msg.authorId ?? undefined);

            console.log(
                "[upsert] Notification - room:",
                roomName,
                "author:",
                authorName,
                "content preview:",
                msg.content ? String(msg.content).substring(0, 50) : "(no content)",
            );

            const timestamp = msg.createdAt ? new Date(msg.createdAt as any) : new Date();

            // Create notification object
            const notification = {
                channelId: roomId,
                channelName: roomName,
                senderName: authorName,
                senderId: msg.authorId ?? "",
                lastMessagePreview: msg.content ? String(msg.content).substring(0, 100) : "(Message vide)",
                timestamp,
                unreadCount: 1,
            };

            try {
                chatNotifications.addNotification(notification);
                console.log("[upsert] Added notification");
            } catch (err) {
                console.warn("[upsert] Failed to add chat notification", err);
            }

            // Show toast notification (safe strings)
            toast.message(`${authorName} in ${roomName}`, {
                description: msg.content ? String(msg.content).substring(0, 100) : "(Message vide)",
            });
        } else {
            console.log("[upsert] Not showing notification (in current room)");
        }
    }

    getTypingIds(roomId: string | null) {
        if (!roomId) return [];
        const map = this.typingUsers[roomId];
        return map ? [...map.keys()] : [];
    }

    async init(getToken?: () => string | Promise<string>) {
        console.log("[ChatStore.init] Starting initialization");
        await chatClient.connect(getToken);
        console.log("[ChatStore.init] Chat client connected");

        chatClient.on<MessageDto>("message:created", (m) => {
            if (!m || !m.roomId) {
                console.warn("[message:created] Ignoring invalid event", m);
                return;
            }
            console.log("[message:created event] Received message event for room:", m.roomId);
            this.upsert(m.roomId, m);
        });
        console.log("[ChatStore.init] Registered message:created handler");

        chatClient.on<ReactionDeltaDto>("message:reaction", (d) => {
            if (!d || !d.roomId) return;
            this.applyReactionDelta(d);
        });

        chatClient.on<{ roomId: string; userId: string; isTyping: boolean }>("user:typing", (p) => {
            if (!p || !p.roomId) return;
            const map = this.typingUsers[p.roomId] ?? new Map<string, number>();
            const now = Date.now();
            for (const [uid, exp] of map) {
                if (exp <= now) map.delete(uid);
            }
            if (p.isTyping) map.set(p.userId, now + TYPING_STOP_MS);
            else map.delete(p.userId);
            // assign a new Map instance to trigger reactivity
            this.typingUsers[p.roomId] = new Map(map);
        });

        chatClient.on<{ roomId: string; messageId: string }>("message:deleted", ({ roomId, messageId }) => {
            if (!messageId) return;
            this.deleteMessage(messageId);
        });

        if (!this.typingPurgeInterval) {
            this.typingPurgeInterval = setInterval(() => {
                const now = Date.now();
                for (const [roomId, map] of Object.entries(this.typingUsers)) {
                    let changed = false;
                    for (const [uid, exp] of map) {
                        if (exp <= now) {
                            map.delete(uid);
                            changed = true;
                        }
                    }
                    if (changed) this.typingUsers[roomId] = new Map(map);
                }
            }, 750);
        }

        this.loadingRooms = true;
        try {
            const rooms = await chatClient.myRooms();
            this.rooms = Array.isArray(rooms) ? rooms : [];
        } catch (err) {
            console.error("[init] Failed to load rooms", err);
            toast.error("Erreur chargement des salons");
        } finally {
            this.loadingRooms = false;
        }
    }

    private async refreshRooms() {
        try {
            const updated = await chatClient.myRooms();
            this.rooms = Array.isArray(updated) ? updated : [];
        } catch (error) {
            console.error("[refreshRooms] Failed to refresh rooms:", error);
        } finally {
            this.loadingRooms = false;
        }
    }

    private extractServerId(room: RoomDto | undefined | null) {
        if (!room) return null;
        const anyRoom = room as any;
        return (
            anyRoom.serverId ??
            anyRoom.server_id ??
            anyRoom.guildId ??
            anyRoom.guild_id ??
            anyRoom.server?.id ??
            anyRoom.guild?.id ??
            null
        );
    }

    private getRoomsByServer(serverId: string) {
        if (!serverId) return [];
        return this.rooms.filter((r) => this.extractServerId(r) === serverId);
    }

    private resolvePendingServer() {
        if (this.resolvingPending || !this.pendingServerId) return;
        const sid = this.pendingServerId;
        const rooms = this.getRoomsByServer(sid);
        if (!rooms.length) return;
        this.resolvingPending = true;
        // Best-effort resolution
        void this.selectServer(sid).finally(() => {
            this.pendingServerId = null;
            this.resolvingPending = false;
        });
    }

    async selectServer(serverId: string) {
        if (!serverId) return;
        const rooms = this.getRoomsByServer(serverId);
        if (!rooms.length) {
            this.pendingServerId = serverId;
            return;
        }
        try {
            localStorage.setItem(LAST_SERVER_KEY, serverId);
        } catch {
            // ignore
        }
        let storedRoom: string | null = null;
        try {
            storedRoom = localStorage.getItem(LAST_ROOM_BY_SERVER_PREFIX + serverId);
        } catch {
            storedRoom = null;
        }
        const targetRoomId =
            (storedRoom && rooms.some((r) => r.id === storedRoom) && storedRoom) || rooms[0]?.id || null;

        if (!targetRoomId || this.currentRoomId === targetRoomId) return;
        await this.selectRoom(targetRoomId);
    }

    async selectRoom(roomId: string) {
        if (!roomId) return;
        if (this.currentRoomId && this.currentRoomId !== roomId) {
            try {
                await chatClient.leaveRoom(this.currentRoomId);
            } catch (err) {
                console.warn("[selectRoom] leaveRoom failed", err);
            }
        }
        this._typingStopNow(); // reset typing when switching

        this.currentRoomId = roomId;
        try {
            await chatClient.joinRoom(roomId);
        } catch (err) {
            console.warn("[selectRoom] joinRoom failed", err);
        }

        this.messagesByRoom[roomId] ??= [];
        this.idsByRoom[roomId] ??= new Set<string>();
        if ((this.messagesByRoom[roomId]?.length ?? 0) === 0) await this.loadMore(roomId);

        this.resolvePendingServer();
    }

    async loadMore(roomId: string, take = 50) {
        if (!roomId) return;
        if (this.loadingMoreByRoom[roomId]) return;
        this.loadingMoreByRoom[roomId] = true;
        try {
            const cursor = this.cursorsByRoom[roomId] ?? null;
            const page: MessagePage = await chatClient.fetchMessages(roomId, take, cursor ?? undefined);

            const items = Array.isArray(page?.items) ? page.items : [];
            const ids = this.idsByRoom[roomId] ?? new Set<string>();
            const existing = this.messagesByRoom[roomId] ?? [];

            const fresh = items.filter((m) => m && !ids.has(m.id));
            for (const m of fresh) {
                if (!m || !m.id) continue;
                ids.add(m.id);
            }

            this.messagesByRoom[roomId] = [...existing, ...fresh];
            this.idsByRoom[roomId] = ids;
            this.cursorsByRoom[roomId] = page?.nextCursor ?? null;
        } catch (err) {
            console.error("[loadMore] failed fetching messages for", roomId, err);
        } finally {
            this.loadingMoreByRoom[roomId] = false;
        }
    }

    async send(content: string) {
        if (!this.currentRoomId || !content || !content.trim()) return;
        try {
            const msg = await chatClient.sendMessage(this.currentRoomId, content.trim());
            if (msg && msg.roomId) this.upsert(msg.roomId, msg);
        } catch (err) {
            console.error("[send] failed to send message", err);
            toast.error("Impossible d'envoyer le message");
        } finally {
            this._typingStopNow(); // stop typing on send
        }
    }

    async markReadTop() {
        const roomId = this.currentRoomId;
        if (!roomId) return;
        const top = this.messagesByRoom[roomId]?.[0];
        if (top?.id) {
            try {
                await chatClient.read(roomId, top.id);
            } catch (err) {
                console.warn("[markReadTop] read failed", err);
            }
        }
    }

    /**
     * API unchanged: call `setTyping(next)` VERY OFTEN (on each keystroke).
     * - next=true  => sends "true" with throttle (>= TYPING_THROTTLE_MS since last send)
     * - next=false => immediate stop (blur, send)
     * If no `true` calls for TYPING_STOP_MS ms, we send "false" automatically (debounce).
     */
    setTyping(next: boolean) {
        const rid = this.currentRoomId;
        if (!rid) return;

        const sendTrue = () => {
            try {
                chatClient.typing(String(rid), true);
            } catch (err) {
                console.warn("[setTyping] typing(true) failed", err);
            }
            this.typingState.isTyping = true;
            this.typingState.lastTrueAt = Date.now();
            this.typingState.roomId = rid;
        };

        const sendFalse = () => {
            if (!this.typingState.isTyping) return;
            try {
                chatClient.typing(String(this.typingState.roomId ?? rid), false);
            } catch (err) {
                console.warn("[setTyping] typing(false) failed", err);
            }
            this.typingState.isTyping = false;
            this.typingState.roomId = null;
        };

        const scheduleInactivityCheck = () => {
            if (this.typingState.stopTimer) clearTimeout(this.typingState.stopTimer);
            this.typingState.stopTimer = setTimeout(() => {
                const now = Date.now();
                const inactiveFor = now - this.typingState.lastActivityAt;
                if (inactiveFor >= TYPING_STOP_MS) {
                    // real inactivity
                    sendFalse();
                    return;
                }
                // still active (keystrokes kept coming but throttle blocked new "true")
                const remaining = TYPING_STOP_MS - inactiveFor;
                this.typingState.stopTimer = setTimeout(() => {
                    // second-level check
                    const now2 = Date.now();
                    if (now2 - this.typingState.lastActivityAt >= TYPING_STOP_MS) {
                        sendFalse();
                    } else {
                        scheduleInactivityCheck(); // reschedule again
                    }
                }, remaining);
            }, TYPING_STOP_MS);
        };

        if (next) {
            const now = Date.now();
            this.typingState.lastActivityAt = now; // update every keystroke

            // throttle network "true"
            if (!this.typingState.isTyping || now - this.typingState.lastTrueAt >= TYPING_THROTTLE_MS) {
                sendTrue();
            }

            // (re)arm guarded inactivity watcher
            scheduleInactivityCheck();
        } else {
            // explicit stop (blur / send)
            this._typingStopNow();
        }
    }

    private _typingStopNow() {
        if (this.typingState.stopTimer) {
            clearTimeout(this.typingState.stopTimer);
            this.typingState.stopTimer = null;
        }
        if (this.typingState.isTyping) {
            try {
                chatClient.typing(String(this.typingState.roomId ?? this.currentRoomId ?? ""), false);
            } catch {
                // swallow
            }
        }
        this.typingState.isTyping = false;
        this.typingState.roomId = null;
        this.typingState.lastActivityAt = 0; // reset
    }

    private applyReactionDelta(d: ReactionDeltaDto) {
        if (!d || !d.roomId || !d.messageId) return;
        const list = this.messagesByRoom[d.roomId];
        if (!list) return;
        const i = list.findIndex((m) => m.id === d.messageId);
        if (i === -1) return;

        // Try to detect current user id from chatClient (best-effort). Safe any cast to avoid type errors.
        const meId = (chatClient as any)?.currentUserId ?? null;

        const msg = { ...(list[i] ?? {}) } as MessageDto;
        const currentReactions = Array.isArray(msg.reactions) ? (msg.reactions as any[]) : [];
        const reactions = [...currentReactions].map((r) => ({
            emoji: String((r && (r as any).emoji) ?? ""),
            count: Number((r && (r as any).count) ?? 0),
            me: Boolean((r && (r as any).me) ?? false),
        })) as { emoji: string; count: number; me: boolean }[];

        const emoji = String(d.emoji ?? "");
        const count = typeof d.count === "number" ? d.count : Number(d.count ?? 0);
        const userId = d.userId ?? "";

        const idx = reactions.findIndex((r) => r.emoji === emoji);
        if (idx === -1) {
            if (count > 0) {
                reactions.push({ emoji, count, me: meId !== null && meId === userId && d.op === "added" });
            }
        } else {
            reactions[idx] = {
                emoji,
                count,
                me: meId !== null && meId === userId ? d.op === "added" : reactions[idx].me,
            };
            if (reactions[idx].count <= 0) reactions.splice(idx, 1);
        }

        msg.reactions = reactions as any;
        const copy = [...list];
        copy[i] = msg;
        this.messagesByRoom[d.roomId] = copy;
    }

    // Exposed for UI
    async react(messageId: string, emoji: string) {
        const rid = this.currentRoomId;
        if (!rid || !messageId || !emoji) return;
        try {
            await chatClient.react(rid, messageId, emoji);
            // No optimistic update; state will be updated via message:reaction
        } catch (err) {
            console.warn("[react] failed", err);
            toast.error("Impossible d'appliquer la réaction");
        }
    }

    deleteMessage(messageId: string) {
        if (!messageId) return;
        const rid = this.currentRoomId;
        if (!rid) {
            console.warn("[deleteMessage] No active roomId, aborting", { messageId });
            return;
        }

        const list = this.messagesByRoom[rid];
        if (!Array.isArray(list)) {
            console.warn("[deleteMessage] No messages for the room", { rid, messageId });
            return;
        }

        const i = list.findIndex((m) => m.id === messageId);
        if (i === -1) {
            console.warn("[deleteMessage] Message not found in list", { rid, messageId });
            return;
        }

        const copy = [...list];
        copy.splice(i, 1);

        this.messagesByRoom[rid] = copy;
        this.idsByRoom[rid]?.delete(messageId);
    }

    /**
     * Create or retrieve a DM room with another user and select it
     */
    async ensureDmAndSelect(otherUserId: string) {
        if (!otherUserId) throw new Error("otherUserId required");
        try {
            // Get or create DM room
            const dmRoom = await chatClient.ensureDm(otherUserId);
            if (dmRoom && dmRoom.id) {
                // Add to rooms list if not already there
                if (!this.rooms.some((r) => r.id === dmRoom.id)) {
                    this.rooms = [dmRoom, ...this.rooms];
                }

                // Select the room (will join and load messages)
                await this.selectRoom(dmRoom.id);
            }

            return dmRoom;
        } catch (error) {
            console.error("Failed to ensure DM:", error);
            toast.error("Impossible de créer la conversation privée");
            throw error;
        }
    }
}

export const chatStore = new ChatStore();

import type { MessageDto, MessagePage, PageCursor, ReactionDeltaDto, RoomDto } from "$lib/shared-models";
import { toast } from "svelte-sonner";
import { chatClient } from "./chatclient.svelte";

const LAST_ROOM_KEY = "chat:lastRoomId";
const LAST_SELECTION_KEY = "chat:lastSelection";
const LAST_SERVER_KEY = "chat:lastServerId";
const LAST_ROOM_BY_SERVER_PREFIX = "chat:lastRoomByServer:";

const TYPING_THROTTLE_MS = 700; // min entre deux "true"
const TYPING_STOP_MS = 3000; // "false" après 3s sans frappe

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

    // ---- état interne typing (throttle + debounce) ----
    private typingState = {
        isTyping: false,
        lastTrueAt: 0,
        roomId: null as string | null,
        stopTimer: null as ReturnType<typeof setTimeout> | null,
        lastActivityAt: 0, // NEW: last keystroke (setTyping(true)) timestamp
    };

    private pendingServerId: string | null = null;
    private resolvingPending = false;
    private typingPurgeInterval: ReturnType<typeof setInterval> | null = null;

    private upsert(roomId: string, msg: MessageDto) {
        const ids = this.idsByRoom[roomId] ?? new Set<string>();
        const list = this.messagesByRoom[roomId] ?? [];
        if (ids.has(msg.id)) {
            const i = list.findIndex((x) => x.id === msg.id);
            if (i !== -1) list[i] = msg;
            this.messagesByRoom[roomId] = [...list];
            return;
        }
        this.messagesByRoom[roomId] = [msg, ...list]; // DESC
        ids.add(msg.id);
        this.idsByRoom[roomId] = ids;
    }

    getTypingIds(roomId: string | null) {
        if (!roomId) return [];
        const map = this.typingUsers[roomId];
        return map ? [...map.keys()] : [];
    }

    async init(getToken?: () => string | Promise<string>) {
        await chatClient.connect(getToken);

        chatClient.on<MessageDto>("message:created", (m) => this.upsert(m.roomId, m));
        chatClient.on<ReactionDeltaDto>("message:reaction", (d) => this.applyReactionDelta(d));

        chatClient.on<{ roomId: string; userId: string; isTyping: boolean }>("user:typing", (p) => {
            const map = this.typingUsers[p.roomId] ?? new Map<string, number>();
            const now = Date.now();
            for (const [uid, exp] of map) if (exp <= now) map.delete(uid);
            if (p.isTyping) map.set(p.userId, now + TYPING_STOP_MS);
            else map.delete(p.userId);
            this.typingUsers[p.roomId] = new Map(map); // reactivité
        });

        if (!this.typingPurgeInterval) {
            this.typingPurgeInterval = setInterval(() => {
                const now = Date.now();
                for (const [roomId, map] of Object.entries(this.typingUsers)) {
                    let changed = false;
                    for (const [uid, exp] of map)
                        if (exp <= now) {
                            map.delete(uid);
                            changed = true;
                        }
                    if (changed) this.typingUsers[roomId] = new Map(map);
                }
            }, 750);
        }

        this.loadingRooms = true;
        try {
            this.rooms = await chatClient.myRooms();
            // (ta migration localStorage peut être recopiée ici si besoin)
        } catch {
            toast.error("Erreur chargement des salons");
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
        return this.rooms.filter((r) => this.extractServerId(r) === serverId);
    }

    private resolvePendingServer() {
        if (this.resolvingPending || !this.pendingServerId) return;
        const sid = this.pendingServerId;
        const rooms = this.getRoomsByServer(sid);
        if (!rooms.length) return;
        this.resolvingPending = true;
        this.selectServer(sid).finally(() => {
            this.pendingServerId = null;
            this.resolvingPending = false;
        });
    }

    async selectServer(serverId: string) {
        const rooms = this.getRoomsByServer(serverId);
        if (!rooms.length) {
            this.pendingServerId = serverId;
            return;
        }
        try {
            localStorage.setItem(LAST_SERVER_KEY, serverId);
        } catch {}
        let storedRoom: string | null = null;
        try {
            storedRoom = localStorage.getItem(LAST_ROOM_BY_SERVER_PREFIX + serverId);
        } catch {}
        const targetRoomId =
            (storedRoom && rooms.some((r) => r.id === storedRoom) && storedRoom) || rooms[0]?.id || null;

        if (!targetRoomId || this.currentRoomId === targetRoomId) return;
        await this.selectRoom(targetRoomId);
    }

    async selectRoom(roomId: string) {
        if (this.currentRoomId && this.currentRoomId !== roomId) {
            await chatClient.leaveRoom(this.currentRoomId);
        }
        this._typingStopNow(); // reset typing lors du switch

        this.currentRoomId = roomId;
        await chatClient.joinRoom(roomId);

        this.messagesByRoom[roomId] ??= [];
        this.idsByRoom[roomId] ??= new Set<string>();
        if (this.messagesByRoom[roomId].length === 0) await this.loadMore(roomId);

        this.resolvePendingServer();
    }

    async loadMore(roomId: string, take = 50) {
        if (this.loadingMoreByRoom[roomId]) return;
        this.loadingMoreByRoom[roomId] = true;
        try {
            const cursor = this.cursorsByRoom[roomId] ?? null;
            const page: MessagePage = await chatClient.fetchMessages(roomId, take, cursor ?? undefined);

            const ids = this.idsByRoom[roomId] ?? new Set<string>();
            const existing = this.messagesByRoom[roomId] ?? [];

            const fresh = page.items.filter((m) => !ids.has(m.id));
            for (const m of fresh) ids.add(m.id);

            this.messagesByRoom[roomId] = [...existing, ...fresh];
            this.idsByRoom[roomId] = ids;
            this.cursorsByRoom[roomId] = page.nextCursor ?? null;
        } finally {
            this.loadingMoreByRoom[roomId] = false;
        }
    }

    async send(content: string) {
        if (!this.currentRoomId || !content.trim()) return;
        const msg = await chatClient.sendMessage(this.currentRoomId, content.trim());
        this.upsert(msg.roomId, msg);
        this._typingStopNow(); // stop à l’envoi
    }

    async markReadTop() {
        const roomId = this.currentRoomId;
        if (!roomId) return;
        const top = this.messagesByRoom[roomId]?.[0];
        if (top) await chatClient.read(roomId, top.id);
    }

    /**
     * API inchangée: appeler `setTyping(next)` TRÈS SOUVENT (chaque frappe).
     * - next=true  => envoie "true" avec throttle (>= TYPING_THROTTLE_MS depuis le dernier envoi)
     * - next=false => stop immédiat (blur, send)
     * Si plus aucun appel true pendant TYPING_STOP_MS, on envoie "false" automatiquement (debounce).
     */
    setTyping(next: boolean) {
        const rid = this.currentRoomId;
        if (!rid) return;

        const sendTrue = () => {
            chatClient.typing(rid, true);
            this.typingState.isTyping = true;
            this.typingState.lastTrueAt = Date.now();
            this.typingState.roomId = rid;
        };

        const sendFalse = () => {
            if (!this.typingState.isTyping) return;
            chatClient.typing(this.typingState.roomId ?? rid, false);
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
            chatClient.typing(this.typingState.roomId ?? this.currentRoomId!, false);
        }
        this.typingState.isTyping = false;
        this.typingState.roomId = null;
        this.typingState.lastActivityAt = 0; // reset
    }

    private applyReactionDelta(d: ReactionDeltaDto) {
        const list = this.messagesByRoom[d.roomId];
        if (!list) return;
        const i = list.findIndex((m) => m.id === d.messageId);
        if (i === -1) return;

        const meId = /* ton user id */ undefined ?? null; // si tu l’as dans un store global, mets-le ici
        const msg = { ...list[i] };
        const reactions = [...(msg.reactions ?? [])] as { emoji: string; count: number; me: boolean }[];

        const idx = reactions.findIndex((r) => r.emoji === d.emoji);
        if (idx === -1) {
            if (d.count > 0)
                reactions.push({ emoji: d.emoji, count: d.count, me: meId === d.userId && d.op === "added" });
        } else {
            reactions[idx] = {
                emoji: d.emoji,
                count: d.count,
                me: meId === d.userId ? d.op === "added" : reactions[idx].me,
            };
            if (reactions[idx].count <= 0) reactions.splice(idx, 1);
        }

        msg.reactions = reactions;
        const copy = [...list];
        copy[i] = msg;
        this.messagesByRoom[d.roomId] = copy;
    }

    // 👇 exposé pour l’UI
    async react(messageId: string, emoji: string) {
        const rid = this.currentRoomId;
        if (!rid) return;
        await chatClient.react(rid, messageId, emoji);
        // Pas d’optimistic ici : l’état viendra via message:reaction
    }
}

export const chatStore = new ChatStore();

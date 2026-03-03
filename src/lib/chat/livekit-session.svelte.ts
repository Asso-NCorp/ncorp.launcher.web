/**
 * LiveKitSession — Svelte 5 runes-based reactive voice/video session.
 *
 * This class encapsulates **all** LiveKit client-side logic:
 * - Connecting / disconnecting to a room
 * - Remote-audio attach/detach (critical for hearing other users)
 * - Screen-share attach/detach
 * - Active-speaker detection
 * - Audio-device enumeration & selection
 * - Preview-participants polling (before joining)
 *
 * It is SSR-safe: all browser APIs are gated behind `typeof window !== "undefined"`.
 */

import { SvelteMap, SvelteSet } from "svelte/reactivity";

/* ---------- types ---------- */

export interface VoiceParticipant {
    identity: string;
    name: string;
    isSpeaking: boolean;
    isLocal: boolean;
    audioEnabled: boolean;
}

export interface PreviewParticipant {
    identity: string;
    name: string;
}

export interface AudioDevice {
    deviceId: string;
    label: string;
}

/* ---------- lazy imports (browser-only) ---------- */

// We store module-level references that are set once on first `connect()`.
// This avoids importing livekit-client at the top level which breaks SSR.
let LK: typeof import("livekit-client") | null = null;

async function ensureLK() {
    if (!LK) {
        LK = await import("livekit-client");
    }
    return LK;
}

function playSound(path: string) {
    if (typeof window === "undefined") return;
    try {
        const audio = new Audio(path);
        audio.volume = 0.5;
        void audio.play().catch(() => {});
    } catch {
        // ignore — audio context not ready or browser blocked autoplay
    }
}

/* ---------- class ---------- */

export class LiveKitSession {
    /* ---- reactive state ---- */
    roomName: string = $state("");
    roomDisplayName: string = $state("");
    identity: string = $state("");
    connected: boolean = $state(false);
    isMuted: boolean = $state(false);
    isSpeaking: boolean = $state(false);
    errorMsg: string = $state("");
    participants: VoiceParticipant[] = $state([]);
    screenSharing: boolean = $state(false);
    screenShareParticipantId: string | null = $state(null);

    audioDevices: AudioDevice[] = $state([]);
    selectedAudioDeviceId: string = $state("");

    /** Noise gate threshold (0 = off, 0–0.1 RMS range). Persisted to localStorage. */
    noiseGateThreshold: number = $state(0);
    /** Noise ceiling threshold (0 = off, 0–0.1 RMS range). Audio above this is muted. Persisted. */
    noiseCeilingThreshold: number = $state(0);
    /** Live microphone RMS level (0–0.1). Updated every 30ms while mic is active. */
    micLevel: number = $state(0);
    /** Whether the mic preview/test is currently active (not connected but testing). */
    micTestActive: boolean = $state(false);
    /** Whether loopback audio is enabled during mic testing. */
    loopbackEnabled: boolean = $state(false);
    /** Whether all incoming audio is muted (and mic is force-muted). */
    isDeafened: boolean = $state(false);
    /** Output gain applied to all remote audio (0–2, default 1 = 100%). Persisted. */
    outputVolume: number = $state(1);

    /** Set of identities currently speaking */
    speakingParticipants: SvelteSet<string> = new SvelteSet();

    /** Preview (before joining) */
    previewParticipants: PreviewParticipant[] = $state([]);
    previewLoading: boolean = $state(false);
    previewError: string = $state("");

    /**
     * Per-channel participant map — used to show who's in each voice channel
     * even when the current user is not connected.
     * Key = channelId (room name), Value = list of participants.
     */
    channelParticipants: SvelteMap<string, PreviewParticipant[]> = new SvelteMap();

    /* ---- private ---- */
    private room: InstanceType<typeof import("livekit-client").Room> | null = null;
    private audioElements: SvelteMap<string, HTMLAudioElement> = new SvelteMap();
    private screenShareVideoEl: HTMLVideoElement | null = null;
    /** Holds the active screen share track so it can be attached when the <video> element mounts. */
    private pendingScreenShareTrack: any | null = null;

    private previewTimer: ReturnType<typeof setInterval> | null = null;
    private previewDebounce: ReturnType<typeof setTimeout> | null = null;
    private channelPollTimer: ReturnType<typeof setInterval> | null = null;
    private disposed = false;

    /* ---- noise gate audio chain (AudioWorklet) ---- */
    private audioCtx: AudioContext | null = null;
    private rawMicStream: MediaStream | null = null;
    private processedTrack: MediaStreamTrack | null = null;
    private gateWorkletNode: AudioWorkletNode | null = null;
    private publishedMicPub: any | null = null;
    private loopbackGain: GainNode | null = null;

    /* ---- remote audio output ---- */
    private outputAudioCtx: AudioContext | null = null;
    private gainNodes: Map<string, GainNode> = new Map();
    private deafenPrevMuted = false;

    /**
     * Monotonically increasing counter used to guard event handlers.
     * Incremented on every disconnect so that stale room events are ignored.
     */
    private roomGeneration = 0;

    constructor() {
        if (typeof window !== "undefined") {
            const gate = localStorage.getItem("noiseGateThreshold");
            if (gate !== null) {
                const v = parseFloat(gate);
                if (!isNaN(v) && v >= 0 && v <= 1) this.noiseGateThreshold = v;
            }
            const ceiling = localStorage.getItem("noiseCeilingThreshold");
            if (ceiling !== null) {
                const v = parseFloat(ceiling);
                if (!isNaN(v) && v >= 0 && v <= 1) this.noiseCeilingThreshold = v;
            }
            const vol = localStorage.getItem("outputVolume");
            if (vol !== null) {
                const v = parseFloat(vol);
                if (!isNaN(v) && v >= 0 && v <= 2) this.outputVolume = v;
            }
        }
    }

    /* ================================================================
     * Connection
     * ================================================================ */

    /**
     * Connect to a LiveKit room.
     * Fetches a short-lived JWT from our server-side endpoint, then joins.
     *
     * @param room — Room name to join (defaults to current `this.roomName`)
     * @param displayName — Human-readable name shown in the UI
     */
    async connect(room?: string, displayName?: string) {
        if (typeof window === "undefined") return;

        const targetRoom = room?.trim() || this.roomName.trim();
        if (!targetRoom) {
            this.errorMsg = "Room name is required.";
            return;
        }

        this.errorMsg = "";

        try {
            const lk = await ensureLK();

            // 1. Fetch token from our server
            const res = await fetch("/api/livekit-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ room: targetRoom }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ message: res.statusText }));
                throw new Error(err.message || `Token request failed (${res.status})`);
            }

            const { token, url, identity } = (await res.json()) as {
                token: string;
                url: string;
                identity: string;
            };

            // 2. Disconnect previous room if any (fire-and-forget internally)
            this.disconnectInternal();

            // 3. Create a fresh Room instance
            const newRoom = new lk.Room({
                adaptiveStream: true,
                dynacast: true,
            });

            this.room = newRoom;
            this.roomName = targetRoom;
            this.roomDisplayName = displayName || targetRoom;
            this.identity = identity;

            // 4. Wire up events BEFORE connecting
            this.setupRoomEvents(lk, newRoom);

            // 5. Connect
            await newRoom.connect(url, token);

            // 6. Try to publish microphone through noise-gate chain (non-fatal — user may have no mic)
            // Preserve pre-set mute/deafen state
            const wasPreMuted = this.isMuted;
            const wasDeafened = this.isDeafened;
            try {
                const processedTrack = await this.startProcessedMic(this.selectedAudioDeviceId || undefined);
                if (processedTrack) {
                    const lkTrack = new lk.LocalAudioTrack(processedTrack, undefined, true);
                    this.publishedMicPub = await newRoom.localParticipant.publishTrack(lkTrack, {
                        source: lk.Track.Source.Microphone,
                    });
                    // Apply pre-set mute state
                    if (wasPreMuted || wasDeafened) {
                        for (const t of this.rawMicStream?.getAudioTracks() ?? []) {
                            t.enabled = false;
                        }
                        this.isMuted = true;
                    } else {
                        this.isMuted = false;
                    }
                } else {
                    console.warn("[LiveKitSession] No microphone available, joining as listener");
                    this.isMuted = true;
                }
            } catch (micErr: any) {
                console.warn("[LiveKitSession] No microphone available, joining as listener:", micErr?.message);
                this.isMuted = true;
            }

            this.connected = true;
            playSound("/assets/sounds/user_joined.mp3");
            this.stopPreviewPolling();
            this.rebuildParticipants();
        } catch (e: any) {
            console.error("[LiveKitSession] connect error:", e);
            this.errorMsg = e?.message ?? String(e);
            this.connected = false;
        }
    }

    /** Disconnect from the current room and reset state. */
    async disconnect() {
        // Play disconnect sound for the local user
        playSound("/assets/sounds/user_left.mp3");

        // Capture before clearing so we can fix channelParticipants below
        const prevRoom = this.roomName;
        const prevIdentity = this.identity;

        this.disconnectInternal();

        this.connected = false;
        this.isMuted = false;
        this.roomDisplayName = "";
        this.isSpeaking = false;
        this.screenSharing = false;
        this.screenShareParticipantId = null;
        this.speakingParticipants.clear();
        this.errorMsg = "";

        // Immediately remove local user from the polling map so the UI
        // doesn't show us as still present in the channel we just left.
        // (The next poll will reconcile the rest.)
        if (prevRoom && prevIdentity) {
            const existing = this.channelParticipants.get(prevRoom);
            if (existing) {
                const filtered = existing.filter((p) => p.identity !== prevIdentity);
                if (filtered.length > 0) {
                    this.channelParticipants.set(prevRoom, filtered);
                } else {
                    this.channelParticipants.delete(prevRoom);
                }
            }
        }
    }

    private disconnectInternal() {
        // Bump generation so any in-flight event handlers from the old room are ignored
        this.roomGeneration++;

        // Clear participants immediately — this prevents Svelte 5's keyed-list
        // reconciler from trying to remove items at the same time as other
        // reactive state changes, which causes the `.prev` TypeError.
        this.participants = [];

        this.stopProcessedMic();
        this.cleanupAllAudio();
        this.detachScreenShare();

        if (this.room) {
            const oldRoom = this.room;
            // Nullify reference first so stale event guards fail immediately
            this.room = null;
            oldRoom.removeAllListeners();
            try {
                oldRoom.localParticipant.removeAllListeners();
            } catch {
                // ignore — localParticipant may already be gone
            }
            // Fire-and-forget: don't block callers on the server round-trip
            // or on the browser releasing mic/camera tracks. This is what
            // caused the 2-5s delay on disconnect/channel-switch.
            void oldRoom.disconnect(true).catch(() => {});
        }
    }

    /* ================================================================
     * Room events
     * ================================================================ */

    private setupRoomEvents(
        lk: typeof import("livekit-client"),
        room: InstanceType<typeof import("livekit-client").Room>,
    ) {
        const RoomEvent = lk.RoomEvent;
        const Track = lk.Track;

        // Capture the current generation so we can detect stale events
        // from a room that has since been disconnected/replaced.
        const gen = this.roomGeneration;
        const isStale = () => this.roomGeneration !== gen;

        room.on(RoomEvent.Disconnected, () => {
            if (isStale()) return;
            this.connected = false;
            this.isSpeaking = false;
            this.screenSharing = false;
            this.screenShareParticipantId = null;
            this.speakingParticipants.clear();
            this.cleanupAllAudio();
            this.detachScreenShare();
            this.participants = [];
            this.room = null;
        });

        room.on(RoomEvent.ParticipantConnected, () => {
            if (isStale()) return;
            playSound("/assets/sounds/user_joined.mp3");
            this.rebuildParticipants();
        });

        room.on(RoomEvent.ParticipantDisconnected, (participant) => {
            if (isStale()) return;
            playSound("/assets/sounds/user_left.mp3");
            this.removeAudioElement(participant.identity);
            this.speakingParticipants.delete(participant.identity);
            if (this.screenShareParticipantId === participant.identity) {
                this.screenShareParticipantId = null;
                this.detachScreenShare();
            }
            this.rebuildParticipants();
        });

        room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
            if (isStale()) return;
            if (track.source === Track.Source.Microphone || track.kind === Track.Kind.Audio) {
                this.attachAudio(track, participant.identity);
            }
            if (track.source === Track.Source.ScreenShare && track.kind === Track.Kind.Video) {
                this.screenShareParticipantId = participant.identity;
                this.attachScreenShare(track);
            }
            this.rebuildParticipants();
        });

        room.on(RoomEvent.TrackUnsubscribed, (track, _pub, participant) => {
            if (isStale()) return;
            if (track.kind === Track.Kind.Audio) {
                this.removeAudioElement(participant.identity);
            }
            if (track.source === Track.Source.ScreenShare) {
                if (this.screenShareParticipantId === participant.identity) {
                    this.screenShareParticipantId = null;
                }
                this.detachScreenShare();
            }
            this.rebuildParticipants();
        });

        room.on(RoomEvent.TrackUnpublished, (pub, participant) => {
            if (isStale()) return;
            if (pub.source === Track.Source.ScreenShare) {
                if (this.screenShareParticipantId === participant.identity) {
                    this.screenShareParticipantId = null;
                }
                this.detachScreenShare();
                this.rebuildParticipants();
            }
        });

        room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
            if (isStale()) return;
            this.speakingParticipants.clear();
            for (const s of speakers) {
                this.speakingParticipants.add(s.identity);
            }
            this.isSpeaking = this.speakingParticipants.has(this.identity);
            this.rebuildParticipants();
        });

        // Handle local screen share being stopped via browser UI ("Stop sharing")
        room.localParticipant.on(lk.ParticipantEvent.LocalTrackUnpublished as any, (pub: any) => {
            if (isStale()) return;
            if (pub?.source === Track.Source.ScreenShare) {
                this.screenSharing = false;
                if (this.screenShareParticipantId === this.identity) {
                    this.screenShareParticipantId = null;
                }
                this.detachScreenShare();
                this.rebuildParticipants();
            }
        });

        room.on(RoomEvent.TrackMuted, () => {
            if (isStale()) return;
            this.rebuildParticipants();
        });
        room.on(RoomEvent.TrackUnmuted, () => {
            if (isStale()) return;
            this.rebuildParticipants();
        });

        // Admin-initiated move: server sends a data message telling us to switch rooms.
        room.on(RoomEvent.DataReceived, (payload) => {
            if (isStale()) return;
            try {
                const msg = JSON.parse(new TextDecoder().decode(payload));
                if (msg?.type === "admin:move" && typeof msg.room === "string") {
                    void this.connect(msg.room);
                }
            } catch {
                // ignore malformed messages
            }
        });
    }

    /* ================================================================
     * Participants list
     * ================================================================ */

    private rebuildParticipants() {
        if (!this.room) {
            this.participants = [];
            return;
        }

        const list: VoiceParticipant[] = [];
        const seen = new Set<string>();

        // Local participant first
        const local = this.room.localParticipant;
        list.push({
            identity: local.identity,
            name: local.name ?? local.identity,
            isSpeaking: this.speakingParticipants.has(local.identity),
            isLocal: true,
            audioEnabled: !this.isMuted,
        });
        seen.add(local.identity);

        // Remote participants — keyed by SID, not identity, so the same user
        // with multiple tabs will appear multiple times; deduplicate by identity.
        for (const [, rp] of this.room.remoteParticipants) {
            if (seen.has(rp.identity)) continue;
            seen.add(rp.identity);
            list.push({
                identity: rp.identity,
                name: rp.name ?? rp.identity,
                isSpeaking: this.speakingParticipants.has(rp.identity),
                isLocal: false,
                audioEnabled: rp.isMicrophoneEnabled,
            });
        }

        this.participants = list;
    }

    /* ================================================================
     * Audio handling
     * ================================================================ */

    private getOutputAudioCtx(): AudioContext {
        if (!this.outputAudioCtx) this.outputAudioCtx = new AudioContext();
        return this.outputAudioCtx;
    }

    private attachAudio(track: any, identity: string) {
        if (typeof document === "undefined") return;

        this.removeAudioElement(identity);

        const audioEl = document.createElement("audio");
        audioEl.autoplay = true;
        audioEl.setAttribute("playsinline", "");
        audioEl.style.display = "none";
        document.body.appendChild(audioEl);

        track.attach(audioEl);

        // Route through Web Audio GainNode so volume can go 0–2×
        try {
            const ctx = this.getOutputAudioCtx();
            const source = ctx.createMediaElementSource(audioEl);
            const gain = ctx.createGain();
            gain.gain.value = this.isDeafened ? 0 : this.outputVolume;
            source.connect(gain);
            gain.connect(ctx.destination);
            this.gainNodes.set(identity, gain);
        } catch {
            // Fallback: direct element volume (no boost above 100%)
            audioEl.volume = this.isDeafened ? 0 : Math.min(this.outputVolume, 1);
        }

        this.audioElements.set(identity, audioEl);
    }

    private removeAudioElement(identity: string) {
        const el = this.audioElements.get(identity);
        if (el) {
            try {
                el.pause();
                el.srcObject = null;
                el.remove();
            } catch {
                // ignore
            }
            this.audioElements.delete(identity);
        }
        this.gainNodes.delete(identity);
    }

    private cleanupAllAudio() {
        for (const [id] of this.audioElements) {
            this.removeAudioElement(id);
        }
    }

    /* ================================================================
     * Screen share
     * ================================================================ */

    /**
     * Call this from a component to give the session a <video> element
     * that screen-share tracks will be attached to.
     *
     * Usage (Svelte action-like):
     *   <video use:session.attachScreenShareVideo />
     * or just:
     *   session.attachScreenShareVideo(videoNode);
     */
    attachScreenShareVideo(node: HTMLVideoElement) {
        this.screenShareVideoEl = node;

        // If a track arrived before this element was mounted, attach it now.
        if (this.pendingScreenShareTrack) {
            this.pendingScreenShareTrack.attach(node);
        }

        // Return a destroy-like cleanup for use as a Svelte action
        return {
            destroy: () => {
                this.screenShareVideoEl = null;
            },
        };
    }

    private attachScreenShare(track: any) {
        this.pendingScreenShareTrack = track;
        if (this.screenShareVideoEl) {
            track.attach(this.screenShareVideoEl);
        }
        // If screenShareVideoEl is null here, the <video> element hasn't mounted yet
        // (Svelte's DOM update is async). attachScreenShareVideo() will attach it once mounted.
    }

    private detachScreenShare() {
        this.pendingScreenShareTrack = null;
        if (this.screenShareVideoEl) {
            this.screenShareVideoEl.srcObject = null;
        }
    }

    /**
     * Toggle local screen share on/off.
     */
    async toggleScreenShare() {
        if (!this.room || !this.connected) return;

        try {
            const next = !this.screenSharing;

            if (next) {
                const lk = await ensureLK();

                // Capture at native resolution.
                // contentHint: 'detail' is the most impactful setting for clarity —
                // it tells the WebRTC encoder to prioritise sharpness over motion,
                // which eliminates the blurry/soft look when sharing text/UI.
                const captureOpts: Parameters<typeof this.room.localParticipant.setScreenShareEnabled>[1] = {
                    resolution: {
                        width: window.screen.width * (window.devicePixelRatio ?? 1),
                        height: window.screen.height * (window.devicePixelRatio ?? 1),
                        frameRate: 30,
                    },
                    contentHint: "detail",
                };

                // h1080fps30 is the highest preset in the SDK; for 4K/1440p screens we
                // keep the same preset but bump the bitrate so the server doesn't
                // re-encode to a lower quality.
                const pixelWidth = window.screen.width * (window.devicePixelRatio ?? 1);
                const preset =
                    pixelWidth >= 3840
                        ? { encoding: { maxBitrate: 8_000_000, maxFramerate: 30 } }
                        : pixelWidth >= 2560
                          ? { encoding: { maxBitrate: 5_000_000, maxFramerate: 30 } }
                          : lk.ScreenSharePresets.h1080fps30;

                const publishOpts: Parameters<typeof this.room.localParticipant.setScreenShareEnabled>[2] = {
                    videoEncoding: preset.encoding,
                };

                await this.room.localParticipant.setScreenShareEnabled(true, captureOpts, publishOpts);
                this.screenSharing = true;
                this.screenShareParticipantId = this.identity;
                playSound("/assets/sounds/screen_share_on.mp3");

                // Attach the local screen share track so the local preview works.
                // There is no TrackSubscribed event for local tracks, so we must
                // find and attach it manually after publishing.
                for (const pub of this.room.localParticipant.trackPublications.values()) {
                    if (pub.source === LK!.Track.Source.ScreenShare && pub.track) {
                        this.attachScreenShare(pub.track);
                        break;
                    }
                }
            } else {
                await this.room.localParticipant.setScreenShareEnabled(false);
                this.screenSharing = false;
                playSound("/assets/sounds/screen_share_off.mp3");
                if (this.screenShareParticipantId === this.identity) {
                    this.screenShareParticipantId = null;
                }
                this.detachScreenShare();
            }
        } catch (e: any) {
            console.error("[LiveKitSession] toggleScreenShare error:", e);
            this.screenSharing = false;
            this.errorMsg = e?.message ?? "Screen share failed.";
        }
    }

    /* ================================================================
     * Microphone / audio device management
     * ================================================================ */

    /**
     * Enumerate audioinput devices.
     * @param requestPermission If true, a temporary getUserMedia is triggered first.
     */
    async refreshAudioDevices(requestPermission = false) {
        if (typeof navigator === "undefined") return;

        try {
            if (requestPermission) {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                for (const t of stream.getTracks()) t.stop();
            }

            const devices = await navigator.mediaDevices.enumerateDevices();
            this.audioDevices = devices
                .filter((d) => d.kind === "audioinput")
                .map((d) => ({
                    deviceId: d.deviceId,
                    label: d.label || `Microphone (${d.deviceId.slice(0, 8)})`,
                }));

            // Default selection
            if (!this.selectedAudioDeviceId && this.audioDevices.length > 0) {
                this.selectedAudioDeviceId = this.audioDevices[0].deviceId;
            }
        } catch (e: any) {
            console.error("[LiveKitSession] refreshAudioDevices error:", e);
        }
    }

    /**
     * Switch the active microphone device.
     * Rebuilds the noise-gate audio chain with the new device.
     */
    async setMicrophoneDevice(deviceId: string) {
        this.selectedAudioDeviceId = deviceId;

        if (this.room && this.connected) {
            try {
                if (this.publishedMicPub?.track) {
                    await this.room.localParticipant.unpublishTrack(this.publishedMicPub.track);
                }

                const processedTrack = await this.startProcessedMic(deviceId);
                if (processedTrack) {
                    const lk = await ensureLK();
                    const lkTrack = new lk.LocalAudioTrack(processedTrack, undefined, true);
                    this.publishedMicPub = await this.room.localParticipant.publishTrack(lkTrack, {
                        source: lk.Track.Source.Microphone,
                    });
                    // Restore mute state at source level
                    if (this.rawMicStream) {
                        for (const t of this.rawMicStream.getAudioTracks()) {
                            t.enabled = !this.isMuted;
                        }
                    }
                }
            } catch (e: any) {
                console.error("[LiveKitSession] setMicrophoneDevice error:", e);
            }
        }
    }

    /**
     * Toggle local microphone mute.
     * Mutes at the raw MediaStreamTrack level — reliable for user-provided custom tracks.
     * Also works when not connected — state is preserved for when user joins.
     */
    async toggleMute() {
        try {
            const newMuted = !this.isMuted;
            // If connected and have a mic stream, toggle the track
            if (this.rawMicStream) {
                for (const t of this.rawMicStream.getAudioTracks()) {
                    t.enabled = !newMuted;
                }
            }
            this.isMuted = newMuted;
            playSound(newMuted ? "/assets/sounds/mute.mp3" : "/assets/sounds/unmute.mp3");
            if (this.connected) {
                this.rebuildParticipants();
            }
        } catch (e: any) {
            console.error("[LiveKitSession] toggleMute error:", e);
        }
    }

    /**
     * Deafen (mute mic + silence all incoming audio) or un-deafen.
     * Also works when not connected — state is preserved for when user joins.
     */
    async toggleDeafen() {
        if (!this.isDeafened) {
            this.deafenPrevMuted = this.isMuted;
            // Force-mute mic at source level
            if (this.rawMicStream) {
                for (const t of this.rawMicStream.getAudioTracks()) t.enabled = false;
            }
            this.isMuted = true;
            // Only update audio elements if connected
            if (this.connected) {
                for (const gain of this.gainNodes.values()) gain.gain.value = 0;
                for (const el of this.audioElements.values()) el.volume = 0;
            }
            this.isDeafened = true;
        } else {
            this.isDeafened = false;
            const vol = this.outputVolume;
            // Only update audio elements if connected
            if (this.connected) {
                for (const gain of this.gainNodes.values()) gain.gain.value = vol;
                for (const [id, el] of this.audioElements) {
                    if (!this.gainNodes.has(id)) el.volume = Math.min(vol, 1);
                }
            }
            // Restore mic to pre-deafen mute state
            if (this.rawMicStream) {
                for (const t of this.rawMicStream.getAudioTracks()) t.enabled = !this.deafenPrevMuted;
            }
            this.isMuted = this.deafenPrevMuted;
        }
        if (this.connected) {
            this.rebuildParticipants();
        }
    }

    /**
     * Set output volume for all remote participants (0 = silent, 1 = 100%, 2 = 200%).
     */
    setOutputVolume(value: number) {
        const clamped = Math.max(0, Math.min(2, value));
        this.outputVolume = clamped;
        if (typeof window !== "undefined") {
            localStorage.setItem("outputVolume", String(clamped));
        }
        if (!this.isDeafened) {
            for (const gain of this.gainNodes.values()) gain.gain.value = clamped;
            for (const [id, el] of this.audioElements) {
                if (!this.gainNodes.has(id)) el.volume = Math.min(clamped, 1);
            }
        }
    }

    /**
     * Start the mic audio chain for settings preview while NOT connected.
     * No-ops if already connected (chain already running).
     */
    async startMicPreview() {
        if (this.connected) return;
        await this.startProcessedMic(this.selectedAudioDeviceId || undefined);
        this.micTestActive = true;
        // Enable loopback by default during testing
        this.setLoopback(true);
    }

    /**
     * Stop the preview mic chain. No-ops if connected (keeps chain running).
     */
    stopMicPreview() {
        if (this.connected) return;
        this.setLoopback(false);
        this.stopProcessedMic();
        this.micTestActive = false;
    }

    /**
     * Toggle mic preview on/off.
     */
    async toggleMicPreview() {
        if (this.micTestActive) {
            this.stopMicPreview();
        } else {
            await this.startMicPreview();
        }
    }

    /**
     * Enable or disable loopback audio (hear yourself through speakers).
     * Only works during mic testing, not when connected to a voice channel.
     */
    setLoopback(enabled: boolean) {
        this.loopbackEnabled = enabled;
        if (!this.gateWorkletNode || !this.audioCtx) return;

        if (enabled && this.micTestActive && !this.connected) {
            // Create loopback gain if needed
            if (!this.loopbackGain) {
                this.loopbackGain = this.audioCtx.createGain();
                this.loopbackGain.gain.value = 0.5; // Lower volume to avoid feedback
                this.loopbackGain.connect(this.audioCtx.destination);
            }
            // Connect worklet output to loopback
            try {
                this.gateWorkletNode.connect(this.loopbackGain);
            } catch {
                // Already connected
            }
        } else {
            // Disconnect loopback
            if (this.loopbackGain && this.gateWorkletNode) {
                try {
                    this.gateWorkletNode.disconnect(this.loopbackGain);
                } catch {
                    // Not connected
                }
            }
        }
    }

    /**
     * Toggle loopback audio on/off.
     */
    toggleLoopback() {
        this.setLoopback(!this.loopbackEnabled);
    }

    /**
     * Update the noise gate threshold and persist it.
     * @param value — 0 (off) to 0.1 (high gate). Typical speech is ~0.01–0.03 RMS.
     */
    setNoiseGateThreshold(value: number) {
        const clamped = Math.max(0, Math.min(1, value));
        this.noiseGateThreshold = clamped;
        if (typeof window !== "undefined") {
            localStorage.setItem("noiseGateThreshold", String(clamped));
        }
        this.syncWorkletThresholds();
    }

    /**
     * Update the noise ceiling threshold and persist it.
     * @param value — 0 (off) to 0.1 (high ceiling). Audio above this is muted.
     */
    setNoiseCeilingThreshold(value: number) {
        const clamped = Math.max(0, Math.min(1, value));
        this.noiseCeilingThreshold = clamped;
        if (typeof window !== "undefined") {
            localStorage.setItem("noiseCeilingThreshold", String(clamped));
        }
        this.syncWorkletThresholds();
    }

    /**
     * Acquire the microphone and route it through an AudioWorklet-based
     * noise-gate chain.  The worklet runs RMS computation + gain gating
     * entirely on the audio rendering thread (no setInterval / main-thread
     * jank).  Returns the processed MediaStreamTrack to publish to LiveKit.
     */
    private async startProcessedMic(deviceId?: string): Promise<MediaStreamTrack | null> {
        if (typeof window === "undefined") return null;
        this.stopProcessedMic();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: deviceId ? { deviceId: { exact: deviceId } } : true,
            });
            this.rawMicStream = stream;

            const ctx = new AudioContext({ sampleRate: 48_000 });
            this.audioCtx = ctx;

            // Load the AudioWorklet module (from /static/audio/)
            await ctx.audioWorklet.addModule("/audio/vad-processor.js");

            const source = ctx.createMediaStreamSource(stream);

            // Create the worklet node with current thresholds
            const worklet = new AudioWorkletNode(ctx, "voice-gate-processor", {
                processorOptions: {
                    noiseGateThreshold: this.noiseGateThreshold,
                    noiseCeilingThreshold: this.noiseCeilingThreshold,
                    sampleRate: ctx.sampleRate,
                },
            });
            this.gateWorkletNode = worklet;

            // Listen for volume/gate reports from the audio thread
            worklet.port.onmessage = (event: MessageEvent) => {
                const { volume } = event.data as { volume: number; gateOpen: boolean };
                this.micLevel = volume;
            };

            const dest = ctx.createMediaStreamDestination();

            // Graph: source → worklet → destination
            source.connect(worklet);
            worklet.connect(dest);

            const processedTrack = dest.stream.getAudioTracks()[0] ?? null;
            this.processedTrack = processedTrack;
            return processedTrack;
        } catch (e) {
            console.warn("[LiveKitSession] startProcessedMic error:", e);
            return null;
        }
    }

    /** Send the current noise gate threshold to the running worklet. */
    private syncWorkletThresholds() {
        this.gateWorkletNode?.port.postMessage({
            noiseGateThreshold: this.noiseGateThreshold,
            noiseCeilingThreshold: this.noiseCeilingThreshold,
        });
    }

    private stopProcessedMic() {
        this.micLevel = 0;
        // Disconnect loopback first
        if (this.loopbackGain && this.gateWorkletNode) {
            try {
                this.gateWorkletNode.disconnect(this.loopbackGain);
            } catch {
                // Not connected
            }
        }
        this.loopbackGain = null;
        if (this.gateWorkletNode) {
            try {
                this.gateWorkletNode.port.close();
                this.gateWorkletNode.disconnect();
            } catch {
                // ignore
            }
            this.gateWorkletNode = null;
        }
        // Stop the processed (destination) track first
        if (this.processedTrack) {
            this.processedTrack.stop();
            this.processedTrack = null;
        }
        if (this.audioCtx) {
            void this.audioCtx.close().catch(() => {});
            this.audioCtx = null;
        }
        if (this.rawMicStream) {
            for (const t of this.rawMicStream.getTracks()) t.stop();
            this.rawMicStream = null;
        }
        this.publishedMicPub = null;
    }

    /* ================================================================
     * Preview participants polling
     * ================================================================ */

    /**
     * Start polling the participants endpoint for a room (before joining).
     * Debounces room-name changes by 400ms, then polls every 5s.
     */
    startPreviewPolling(room?: string) {
        const target = room ?? this.roomName;
        if (!target.trim()) return;

        this.roomName = target;
        this.stopPreviewPolling();

        // debounce before first fetch
        this.previewDebounce = setTimeout(() => {
            void this.fetchPreviewParticipants();
            this.previewTimer = setInterval(() => {
                if (!this.connected && !this.disposed) {
                    void this.fetchPreviewParticipants();
                }
            }, 5_000);
        }, 400);
    }

    stopPreviewPolling() {
        if (this.previewDebounce) {
            clearTimeout(this.previewDebounce);
            this.previewDebounce = null;
        }
        if (this.previewTimer) {
            clearInterval(this.previewTimer);
            this.previewTimer = null;
        }
    }

    private async fetchPreviewParticipants() {
        const room = this.roomName.trim();
        if (!room) return;

        this.previewLoading = true;
        this.previewError = "";

        try {
            const res = await fetch(`/api/livekit-participants?room=${encodeURIComponent(room)}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const raw = (await res.json()) as PreviewParticipant[];
            const seen = new Set<string>();
            this.previewParticipants = raw.filter((p) => {
                if (seen.has(p.identity)) return false;
                seen.add(p.identity);
                return true;
            });
        } catch (e: any) {
            this.previewError = e?.message ?? "Failed to fetch participants.";
            this.previewParticipants = [];
        } finally {
            this.previewLoading = false;
        }
    }

    /* ================================================================
     * Cleanup
     * ================================================================ */

    /**
     * Full teardown. Call from onDestroy or $effect teardown.
     */
    cleanup() {
        this.disposed = true;
        this.stopPreviewPolling();
        this.stopChannelPolling();
        void this.disconnect();
    }

    /* ================================================================
     * Global channel participants polling
     * ================================================================ */

    /**
     * Start polling ALL active LiveKit rooms to populate channelParticipants.
     * Should be called once when entering the chat section.
     */
    startChannelPolling() {
        if (this.channelPollTimer) return; // already polling
        void this.fetchAllRoomParticipants();
        this.channelPollTimer = setInterval(() => {
            if (!this.disposed) {
                void this.fetchAllRoomParticipants();
            }
        }, 5_000);
    }

    stopChannelPolling() {
        if (this.channelPollTimer) {
            clearInterval(this.channelPollTimer);
            this.channelPollTimer = null;
        }
    }

    private async fetchAllRoomParticipants() {
        try {
            const res = await fetch("/api/livekit-rooms");
            if (!res.ok) return;
            const data = (await res.json()) as Record<string, PreviewParticipant[]>;

            // Update the map: add/update rooms with participants, remove empty ones
            const activeRoomNames = new Set(Object.keys(data));

            // Remove rooms that are no longer active
            for (const key of this.channelParticipants.keys()) {
                if (!activeRoomNames.has(key)) {
                    this.channelParticipants.delete(key);
                }
            }

            // Add/update active rooms — deduplicate by identity so that a user
            // with multiple sessions (e.g. two tabs) never produces a duplicate
            // key in keyed {#each} blocks.
            for (const [roomName, participants] of Object.entries(data)) {
                const seen = new Set<string>();
                const deduped = participants.filter((p) => {
                    if (seen.has(p.identity)) return false;
                    seen.add(p.identity);
                    return true;
                });
                this.channelParticipants.set(roomName, deduped);
            }
        } catch {
            // Silently ignore — polling will retry
        }
    }
}

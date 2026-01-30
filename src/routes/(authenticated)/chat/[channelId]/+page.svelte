<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import * as signalR from "@microsoft/signalr";
    import { PUBLIC_BACKEND_API_URL } from "$env/static/public";
    import { liveUsers } from "$src/lib/states/live-users.svelte.js";
    import { chatNotifications } from "$src/lib/states/chat-notifications.svelte";
    import { page } from "$app/stores";
    import type { User } from "better-auth";

    // Define the props type (data from SvelteKit's load function)
    let { data } = $props();
    const channelId = data.channelId as string;
    const localUserId = data.user.id as string;
    const localUser = data.user as User;

    // State variables with TypeScript types
    let nickname: string = localUser.name;
    let devices: MediaDeviceInfo[] = $state([]);
    let selectedDeviceId: string = "";
    let joined: boolean = false;
    let messages: ChatMessage[] = [];
    let message: string = "";
    let hubConnection: signalR.HubConnection;
    let stream: MediaStream;
    let audioContext: AudioContext;
    let analyser: AnalyserNode;
    let peerConnections: Record<string, RTCPeerConnection> = {};
    // Interface for chat messages
    interface ChatMessage {
        nickname: string;
        text: string;
    }

    // Clear notification when user enters this channel
    $effect(() => {
        const currentPath = $page.url.pathname;
        if (currentPath === `/chat/${channelId}`) {
            chatNotifications.clearNotification(channelId);
        }
    });

    // Initialize microphone permissions and device list on mount
    onMount(async () => {
        try {
            const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            permissionStream.getTracks().forEach((track) => track.stop());
            const allDevices = await navigator.mediaDevices.enumerateDevices();
            devices = allDevices.filter((device) => device.kind === "audioinput");
            if (devices.length > 0) {
                selectedDeviceId = devices[0].deviceId;
            }
        } catch (err) {
            console.error("Error getting audio permission:", err);
        }
    });

    const updateSpeakingUI = (userId: string, speaking: boolean) => {
        liveUsers.updateSpeakingStatus(userId, speaking);
    };

    function isSpeaking(): boolean {
        if (!analyser) return false;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            const value = (dataArray[i] - 128) / 128.0; // Normalize to -1 to 1
            sum += value * value;
        }
        const rms = Math.sqrt(sum / bufferLength);
        return rms > 0.01; // Threshold (tweak based on testing)
    }

    let wasSpeaking = false;
    let stopSpeakingTimeout: NodeJS.Timeout | null = null;

    function checkSpeaking() {
        const speaking = isSpeaking();

        if (speaking && !wasSpeaking) {
            // User started speaking
            wasSpeaking = true;
            if (stopSpeakingTimeout) {
                clearTimeout(stopSpeakingTimeout); // Cancel any pending stop
                stopSpeakingTimeout = null;
            }
            hubConnection.invoke("SendSpeakingStatus", channelId, true);
            updateSpeakingUI(localUserId, true);
        } else if (!speaking && wasSpeaking) {
            // User stopped speaking, debounce the stop action
            if (!stopSpeakingTimeout) {
                stopSpeakingTimeout = setTimeout(() => {
                    wasSpeaking = false;
                    hubConnection.invoke("SendSpeakingStatus", channelId, false);
                    updateSpeakingUI(localUserId, false);
                    stopSpeakingTimeout = null;
                }, 500); // 500ms delay
            }
        } else if (speaking && wasSpeaking) {
            // User is still speaking, ensure no stop is pending
            if (stopSpeakingTimeout) {
                clearTimeout(stopSpeakingTimeout);
                stopSpeakingTimeout = null;
            }
        }

        requestAnimationFrame(checkSpeaking);
    }

    // Join the channel with WebRTC and SignalR
    async function joinChannel(): Promise<void> {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined },
            });

            hubConnection = new signalR.HubConnectionBuilder()
                .withUrl(`${PUBLIC_BACKEND_API_URL}/chat-live`)
                .withAutomaticReconnect()
                .build();

            // Initialize AudioContext and AnalyserNode
            audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048; // Size of the FFT for analysis (adjustable)
            source.connect(analyser);

            // Start detecting speaking
            requestAnimationFrame(checkSpeaking);

            // SignalR event handlers
            hubConnection.on("UserJoined", (userId: string, connectionId: string) => {
                if (connectionId !== hubConnection.connectionId) {
                    createPeerConnection(connectionId);

                    // Play sound
                    const audio = new Audio("/assets/sounds/user_joined.mp3");
                    audio.play();
                }
            });

            hubConnection.on("UserLeft", (userId: string, connectionId: string) => {
                peerConnections[connectionId]?.close();
                delete peerConnections[connectionId];
                // Play sound
                const audio = new Audio("/assets/sounds/user_left.mp3");
                audio.play();
            });

            hubConnection.on("ReceiveMessage", (msg: string) => {
                messages = [...messages, { nickname, text: msg }];
                
                // Add notification if user is not currently viewing this channel
                const currentPath = $page.url.pathname;
                if (currentPath !== `/chat/${channelId}`) {
                    chatNotifications.addNotification({
                        channelId,
                        channelName: channelId,
                        senderName: nickname,
                        senderId: localUserId,
                        lastMessagePreview: msg.substring(0, 100),
                        timestamp: new Date(),
                        unreadCount: 1,
                    });
                }
            });

            hubConnection.on("ReceiveOffer", (fromConnectionId: string, offer: string) => {
                handleOffer(fromConnectionId, offer);
            });

            hubConnection.on("ReceiveAnswer", (fromConnectionId: string, answer: string) => {
                handleAnswer(fromConnectionId, answer);
            });

            hubConnection.on("ReceiveIceCandidate", (fromConnectionId: string, candidate: string) => {
                handleIceCandidate(fromConnectionId, candidate);
            });

            hubConnection.on("ReceiveSpeakingStatus", (userId: string, speaking: boolean) => {
                updateSpeakingUI(userId, speaking);
            });

            await hubConnection.start();
            await hubConnection.invoke("JoinChannel", channelId);
            joined = true;
        } catch (err) {
            console.error("Error joining channel:", err);
        }
    }

    // Send a text message via SignalR
    function sendMessage(): void {
        if (message.trim()) {
            hubConnection.invoke("SendMessage", channelId, message);
            message = "";
        }
    }

    // Create a WebRTC peer connection for a target user
    async function createPeerConnection(targetConnectionId: string): Promise<void> {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate) {
                hubConnection.invoke("SendIceCandidate", targetConnectionId, JSON.stringify(event.candidate));
            }
        };

        pc.ontrack = (event: RTCTrackEvent) => {
            const audio = new Audio();
            audio.srcObject = event.streams[0];
            audio.autoplay = true;
            document.body.appendChild(audio);
        };

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        peerConnections[targetConnectionId] = pc;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        hubConnection.invoke("SendOffer", targetConnectionId, JSON.stringify(offer));
    }

    // Handle an incoming WebRTC offer
    async function handleOffer(fromConnectionId: string, offer: string): Promise<void> {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate) {
                hubConnection.invoke("SendIceCandidate", fromConnectionId, JSON.stringify(event.candidate));
            }
        };

        pc.ontrack = (event: RTCTrackEvent) => {
            const audio = new Audio();
            audio.srcObject = event.streams[0];
            audio.autoplay = true;
            document.body.appendChild(audio);
        };

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        peerConnections[fromConnectionId] = pc;

        const offerObj = JSON.parse(offer) as RTCSessionDescriptionInit;
        await pc.setRemoteDescription(new RTCSessionDescription(offerObj));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        hubConnection.invoke("SendAnswer", fromConnectionId, JSON.stringify(answer));
    }

    // Handle an incoming WebRTC answer
    async function handleAnswer(fromConnectionId: string, answer: string): Promise<void> {
        const pc = peerConnections[fromConnectionId];
        if (pc) {
            const answerObj = JSON.parse(answer) as RTCSessionDescriptionInit;
            await pc.setRemoteDescription(new RTCSessionDescription(answerObj));
        }
    }

    // Handle an incoming WebRTC ICE candidate
    async function handleIceCandidate(fromConnectionId: string, candidate: string): Promise<void> {
        const pc = peerConnections[fromConnectionId];
        if (pc) {
            const candidateObj = JSON.parse(candidate) as RTCIceCandidateInit;
            await pc.addIceCandidate(new RTCIceCandidate(candidateObj));
        }
    }

    // Cleanup on component destruction
    onDestroy(() => {
        if (hubConnection) {
            hubConnection.invoke("LeaveChannel", channelId);
            hubConnection.stop();
        }
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
        }
        Object.values(peerConnections).forEach((pc) => pc.close());
    });
</script>

<!-- UI -->
<h1>Channel: {channelId}</h1>

{#if !joined}
    <div>
        <label for="nickname">Nickname:</label>
        <input id="nickname" type="text" bind:value={nickname} placeholder="Enter your nickname" />
    </div>
    <div>
        <label for="device">Microphone:</label>
        <select id="device" bind:value={selectedDeviceId}>
            {#each devices as device}
                <option value={device.deviceId}>{device.label || "Microphone " + device.deviceId}</option>
            {/each}
        </select>
    </div>
    <button on:click={joinChannel}>Join</button>
{:else}
    <div class="container">
        <div class="users">
            <h2>Users</h2>
            <ul>
                {#each liveUsers.users as user, i}
                    <li>{user.name}</li>
                {/each}
            </ul>
        </div>

        <div class="chat">
            <h2>Chat</h2>
            <div class="messages">
                {#each messages as msg}
                    <p>
                        <strong>{msg.nickname}:</strong>
                        {msg.text}
                    </p>
                {/each}
            </div>
            <form on:submit|preventDefault={sendMessage}>
                <input type="text" bind:value={message} placeholder="Type a message..." />
                <button type="submit">Send</button>
            </form>
        </div>
    </div>
{/if}

<!-- Styles -->
<style>
    .container {
        display: flex;
        gap: 20px;
    }
    .users,
    .chat {
        flex: 1;
    }
    .messages {
        border: 1px solid #ccc;
        padding: 10px;
        height: 300px;
        overflow-y: auto;
    }
    form {
        margin-top: 10px;
        display: flex;
        gap: 10px;
    }
    input {
        flex: 1;
    }
</style>

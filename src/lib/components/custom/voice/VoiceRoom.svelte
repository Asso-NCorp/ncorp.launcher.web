<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { PUBLIC_MEDIASOUP_URL } from "$env/static/public";
    import MediasoupClient, { type RemotePeer } from "$src/lib/voice/MediasoupClient";
    import { authClient } from "$src/lib/auth/client";

    // État local
    let mediasoupClient: MediasoupClient | null = null;
    let audioStarted = false;
    let userId: string;
    let remotePeers: RemotePeer[] = [];
    let isConnected = false;
    let roomId = "room1"; // Room ID par défaut

    onMount(async () => {
        console.log("VoiceRoom component mounted");

        try {
            // Créer un ID utilisateur persistant
            const session = await authClient.getSession();
            userId = session.data?.user.id;

            // Créer le client MediaSoup
            const serverUrl = PUBLIC_MEDIASOUP_URL;
            mediasoupClient = new MediasoupClient(serverUrl, userId);

            // Définir les callbacks
            setupCallbacks();

            // Joindre la salle
            console.log(`Joining room: ${roomId}`);
            mediasoupClient.joinRoom(roomId);

            isConnected = true;
        } catch (error) {
            console.error("Error in VoiceRoom onMount:", error);
        }
    });

    function setupCallbacks() {
        if (!mediasoupClient) return;

        mediasoupClient.onRemotePeerJoined = (peerId) => {
            console.log(`Remote peer joined: ${peerId}`);
            updateRemotePeers();
        };

        mediasoupClient.onRemotePeerLeft = (peerId) => {
            console.log(`Remote peer left: ${peerId}`);
            updateRemotePeers();

            // Nettoyer l'élément audio
            const audioElement = document.getElementById(`audio-${peerId}`) as HTMLAudioElement;
            if (audioElement) {
                audioElement.srcObject = null;
                audioElement.remove();
            }
        };

        mediasoupClient.onRemotePeerAudio = (peerId, stream) => {
            console.log(`Got audio stream from remote peer: ${peerId}`);
            playRemoteAudio(peerId, stream);
            updateRemotePeers();
        };

        mediasoupClient.onRemotePeerAudioEnded = (peerId) => {
            console.log(`Audio ended from remote peer: ${peerId}`);

            // Nettoyer l'élément audio
            const audioElement = document.getElementById(`audio-${peerId}`) as HTMLAudioElement;
            if (audioElement) {
                audioElement.srcObject = null;
            }

            updateRemotePeers();
        };

        mediasoupClient.onLocalAudioStateChanged = (isActive) => {
            audioStarted = isActive;
            console.log(`Local audio state changed: ${isActive ? "active" : "inactive"}`);
        };
    }

    function updateRemotePeers() {
        if (!mediasoupClient) return;

        // Obtenir la liste à jour des pairs distants
        const peersMap = mediasoupClient.getRemotePeers();

        // Convertir la map en tableau, en excluant notre propre utilisateur
        remotePeers = Array.from(peersMap.values()).filter((peer) => peer.userId !== userId);

        console.log("Remote Peers:", remotePeers.length);
        console.log(remotePeers);
    }

    function playRemoteAudio(peerId: string, stream: MediaStream) {
        // Créer ou obtenir l'élément audio
        let audioElement = document.getElementById(`audio-${peerId}`) as HTMLAudioElement;

        if (!audioElement) {
            audioElement = document.createElement("audio");
            audioElement.id = `audio-${peerId}`;
            audioElement.autoplay = true;
            audioElement.controls = false; // Masqué pour le chat vocal
            document.body.appendChild(audioElement);
        }

        // Attribuer le flux audio
        audioElement.srcObject = stream;

        // Démarrer la lecture
        audioElement.play().catch((error) => {
            console.error(`Error playing audio for peer ${peerId}:`, error);
        });
    }

    async function startAudio() {
        try {
            if (mediasoupClient && !audioStarted) {
                console.log("Starting audio production...");
                await mediasoupClient.produceAudio();
                audioStarted = true;
            }
        } catch (error) {
            console.error("Failed to start audio:", error);
        }
    }

    async function toggleAudio() {
        try {
            if (!mediasoupClient) return;

            if (audioStarted) {
                console.log("Stopping audio production...");
                await mediasoupClient.toggleAudio();
            } else {
                console.log("Starting audio production...");
                await mediasoupClient.toggleAudio();
            }
        } catch (error) {
            console.error("Failed to toggle audio:", error);
        }
    }

    function generateUserId() {
        // Assurer que l'ID utilisateur est persistant entre les rechargements
        let storedUserId = localStorage.getItem("userId");
        if (!storedUserId) {
            storedUserId = crypto.randomUUID();
            localStorage.setItem("userId", storedUserId);
        }
        console.log(`Using user ID: ${storedUserId}`);
        return storedUserId;
    }

    onDestroy(() => {
        console.log("VoiceRoom component destroyed");

        // Nettoyer les éléments audio
        //document.querySelectorAll('audio[id^="audio-"]').forEach((el) => el.remove());

        // Fermer le client MediaSoup
        if (mediasoupClient) {
            mediasoupClient.close();
            mediasoupClient = null;
        }
    });
</script>

<div class="voice-room">
    <h2>Voice Chat Room: {roomId}</h2>

    <div class="status">
        {#if isConnected}
            <p>Connected as: {userId}</p>
        {:else}
            <p>Connecting...</p>
        {/if}
    </div>

    <div class="audio-controls">
        {#if !audioStarted}
            <button class="btn start-audio" on:click={startAudio}>Start Microphone</button>
        {:else}
            <button class="btn stop-audio" on:click={toggleAudio}>Stop Microphone</button>
        {/if}
    </div>

    <div class="participants">
        <h3>Participants ({remotePeers.length})</h3>

        {#if remotePeers.length === 0}
            <p class="empty-state">No other participants in the room</p>
        {:else}
            <ul class="peer-list">
                {#each remotePeers as peer}
                    <li class="peer-item" class:speaking={peer.hasAudioStream}>
                        <div class="peer-avatar">
                            {peer.userId.substring(0, 2).toUpperCase()}
                        </div>
                        <div class="peer-info">
                            <span class="peer-id">{peer.userId.substring(0, 8)}...</span>
                            {#if peer.hasAudioStream}
                                <span class="audio-status speaking">Speaking</span>
                            {:else}
                                <span class="audio-status silent">Silent</span>
                            {/if}
                        </div>
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
</div>

<style>
    .voice-room {
        padding: 1.5rem;
        background: hsl(var(--background-subtle) / var(--tw-bg-opacity, 1));
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        max-width: 600px;
        margin: 2rem auto;
    }

    h2 {
        margin-top: 0;
        color: #343a40;
        border-bottom: 1px solid #dee2e6;
        padding-bottom: 0.75rem;
    }

    .status {
        background-color: #3d3d3d;
        padding: 0.75rem;
        border-radius: 4px;
        margin-bottom: 1rem;
    }

    .status p {
        margin: 0;
    }

    .audio-controls {
        margin-bottom: 1.5rem;
    }

    .btn {
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        border: none;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .start-audio {
        background-color: #28a745;
        color: white;
    }

    .start-audio:hover {
        background-color: #218838;
    }

    .stop-audio {
        background-color: #dc3545;
        color: white;
    }

    .stop-audio:hover {
        background-color: #c82333;
    }

    .participants h3 {
        color: #495057;
        margin-bottom: 1rem;
    }

    .empty-state {
        color: #6c757d;
        font-style: italic;
    }

    .peer-list {
        list-style-type: none;
        padding: 0;
        margin: 0;
    }

    .peer-item {
        display: flex;
        align-items: center;
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        background: white;
        border-radius: 4px;
        border-left: 4px solid #6c757d;
        transition: all 0.2s;
    }

    .peer-item.speaking {
        border-left-color: #28a745;
        background-color: #e6f7ec;
    }

    .peer-avatar {
        width: 36px;
        height: 36px;
        background: #adb5bd;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
        margin-right: 1rem;
    }

    .peer-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .peer-id {
        font-family: monospace;
        font-size: 0.9rem;
        color: #495057;
    }

    .audio-status {
        font-size: 0.8rem;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        display: inline-block;
        max-width: fit-content;
    }

    .speaking {
        background-color: #d4edda;
        color: #155724;
    }

    .silent {
        background-color: #f8f9fa;
        color: #6c757d;
    }
</style>

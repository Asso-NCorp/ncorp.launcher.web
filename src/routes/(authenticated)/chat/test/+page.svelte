<script lang="ts">
    import { onMount } from "svelte";
    import * as mediasoupClient from "mediasoup-client";
    import { io } from "socket.io-client";

    const socket = io("http://localhost:3000");
    let device: mediasoupClient.Device;

    onMount(async () => {
        console.log("Component mounted");

        socket.on("connect", async () => {
            console.log("Socket connected!");
            try {
                await joinVoiceChannel();
            } catch (err) {
                console.error("Error in joinVoiceChannel:", err);
            }
        });

        socket.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
        });
    });

    async function emitWithAck(event: string, data?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            console.log(`Emitting ${event} with data:`, data);
            socket.emit(event, data, (response) => {
                console.log(`Received response for ${event}:`, response);
                if (response && response.error) {
                    console.error(`Server returned error for ${event}:`, response.error);
                    reject(response.error); // Rejette la promesse en cas d'erreur serveur
                } else {
                    resolve(response);
                }
            });

            // Ajoute un timeout pour gérer les cas où le serveur ne répond pas
            setTimeout(() => {
                console.warn(`Timeout: Server did not respond to ${event} within 5 seconds.`);
                reject(new Error(`Timeout: Server did not respond to ${event} within 5 seconds.`));
            }, 5000); // 5 secondes
        });
    }

    async function joinVoiceChannel() {
        console.log("Starting joinVoiceChannel");

        try {
            // Initialize MediaSoup Device
            device = new mediasoupClient.Device();
            console.log("Device created");

            const routerRtpCapabilities = await emitWithAck("getRouterRtpCapabilities");
            console.log("Received routerRtpCapabilities:", routerRtpCapabilities);

            await device.load({ routerRtpCapabilities });
            console.log("Device loaded with RTP capabilities");
        } catch (err) {
            console.error("Error:", err);
        }
    }
</script>

<h1>Voice Chat</h1>

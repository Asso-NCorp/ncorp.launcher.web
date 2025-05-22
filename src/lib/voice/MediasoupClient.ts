// MediasoupClient.ts
import { Device } from 'mediasoup-client';
import { Socket, io } from 'socket.io-client';

export interface RemotePeer {
    id: string;
    userId: string;
    hasAudioStream: boolean;
    consumer?: any;
    stream?: MediaStream;
}

export type PeerJoinedCallback = (userId: string) => void;
export type PeerLeftCallback = (userId: string) => void;
export type AudioStateChangedCallback = (isActive: boolean) => void;
export type RemotePeerAudioCallback = (userId: string, stream: MediaStream) => void;

export default class MediasoupClient {
    private socket: Socket | null = null;
    private _device: Device;
    private _roomId: string = '';
    private _userId: string;
    private _producerTransport: any = null;
    private _consumerTransport: any = null;
    private _producer: any = null;
    private _consumers: Map<string, any> = new Map();
    private _remotePeers: Map<string, RemotePeer> = new Map();
    private _localStream: MediaStream | null = null;
    private serverUrl: string;

    // Callbacks
    public onRemotePeerJoined?: PeerJoinedCallback;
    public onRemotePeerLeft?: PeerLeftCallback;
    public onLocalAudioStateChanged?: AudioStateChangedCallback;
    public onRemotePeerAudio?: RemotePeerAudioCallback;
    public onRemotePeerAudioEnded?: (userId: string) => void;

    constructor(serverUrl: string, userId: string) {
        this.serverUrl = serverUrl;
        this._userId = userId;
        this._device = new Device();

        console.log(`[MediaSoup] Initialized with user ID: ${this._userId}`);
        this.connectSocket();
    }

    private connectSocket(): void {
        try {
            console.log('[MediaSoup] Connecting to WebSocket server:', this.serverUrl);

            this.socket = io(this.serverUrl, {
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000
            });

            this.socket.on('connect', () => {
                console.log('[MediaSoup] Socket connected with ID:', this.socket?.id);
                this.setupSocketHandlers();
            });

            this.socket.on('connect_error', (error) => {
                console.error('[MediaSoup] Socket connection error:', error);
            });

            this.socket.on('disconnect', (reason) => {
                console.log(`[MediaSoup] Socket disconnected: ${reason}`);
            });

        } catch (error) {
            console.error('[MediaSoup] Error connecting to WebSocket server:', error);
        }
    }

    private setupSocketHandlers(): void {
        if (!this.socket) return;

        this.socket.on('router-rtpCapabilities', async (routerRtpCapabilities) => {
            console.log('[MediaSoup] Received router RTP capabilities');

            try {
                // Load the device with the router's RTP capabilities
                await this._device.load({ routerRtpCapabilities });
                console.log('[MediaSoup] Device loaded');

                // Create send and receive transports
                await this.createSendTransport();
                await this.createRecvTransport();
            } catch (error) {
                console.error('[MediaSoup] Error loading device:', error);
            }
        });

        this.socket.on('transport-created', async (params) => {
            console.log(`[MediaSoup] Transport created: ${params.id}, sender: ${params.sender}`);

            try {
                if (params.sender) {
                    await this.connectSendTransport(params);
                } else {
                    await this.connectRecvTransport(params);
                }
            } catch (error) {
                console.error('[MediaSoup] Error handling transport-created:', error);
            }
        });

        this.socket.on('transport-connected', ({ transportId }) => {
            console.log(`[MediaSoup] Transport ${transportId} connected`);
        });

        this.socket.on('producer-created', async ({ id }) => {
            console.log(`[MediaSoup] Producer created: ${id}`);
            // Update local state to reflect that we're producing
            const localPeer = this.getOrCreatePeer(this._userId);
            localPeer.hasAudioStream = true;

            // Trigger our own event for the UI
            this.onLocalAudioStateChanged?.(true);
        });

        this.socket.on('consumer-created', async (params) => {
            const { id, producerId, kind, rtpParameters, producerUserId } = params;
            console.log(`[MediaSoup] Consumer created: ${id} for producer ${producerId} from user ${producerUserId}`);

            try {
                const consumer = await this._consumerTransport.consume({
                    id,
                    producerId,
                    kind,
                    rtpParameters
                });

                this._consumers.set(consumer.id, consumer);

                // Create a MediaStream with the consumer's track
                const stream = new MediaStream([consumer.track]);

                // Update the remote peer state
                const remotePeer = this.getOrCreatePeer(producerUserId);
                remotePeer.consumer = consumer;
                remotePeer.stream = stream;
                remotePeer.hasAudioStream = true;

                console.log(`[MediaSoup] Updated remote peer state for ${producerUserId}:`, remotePeer);

                // Resume the consumer and emit the stream
                this.resumeConsumer(consumer.id);
                this.onRemotePeerAudio?.(producerUserId, stream);

            } catch (error) {
                console.error('[MediaSoup] Error creating consumer:', error);
            }
        });

        this.socket.on('consumer-resumed', ({ consumerId }) => {
            console.log(`[MediaSoup] Consumer resumed: ${consumerId}`);
        });

        this.socket.on('new-producer', async (data) => {
            const { producerId, producerUserId, kind } = data;
            console.log(`[MediaSoup] New producer detected: ${producerId} from user ${producerUserId}, kind: ${kind}`);

            // Si c'est notre propre producteur, ignorer
            if (producerUserId === this._userId) {
                console.log(`[MediaSoup] Ignoring our own producer ${producerId}`);
                return;
            }

            try {
                // Consommer ce producteur
                console.log(`[MediaSoup] Starting consumption from producer ${producerId}`);
                await this.consume(producerId, producerUserId);
            } catch (error) {
                console.error(`[MediaSoup] Failed to consume producer ${producerId}:`, error);
            }
        });

        this.socket.on('producer-closed', ({ consumerId, producerId, producerUserId }) => {
            console.log(`[MediaSoup] Producer ${producerId} from user ${producerUserId} closed`);

            const consumer = this._consumers.get(consumerId);
            if (consumer) {
                consumer.close();
                this._consumers.delete(consumerId);
            }

            // Update remote peer state
            const remotePeer = this._remotePeers.get(producerUserId);
            if (remotePeer) {
                remotePeer.hasAudioStream = false;
                remotePeer.consumer = null;
                remotePeer.stream = null;

                // Trigger event for UI update
                this.onRemotePeerAudioEnded?.(producerUserId);
            }
        });

        this.socket.on('user-joined', ({ userId }) => {
            console.log(`[MediaSoup] User joined: ${userId}`);

            // Create a new remote peer or update existing one
            this.getOrCreatePeer(userId);

            // Trigger the callback
            this.onRemotePeerJoined?.(userId);
        });

        this.socket.on('user-left', ({ userId }) => {
            console.log(`[MediaSoup] User left: ${userId}`);

            // Remove the remote peer
            this._remotePeers.delete(userId);

            // Trigger the callback
            this.onRemotePeerLeft?.(userId);
        });

        this.socket.on('existing-users', ({ users }) => {
            console.log(`[MediaSoup] Existing users: ${users.length}`, users);

            // Create remote peers for existing users
            for (const userId of users) {
                this.getOrCreatePeer(userId);
                this.onRemotePeerJoined?.(userId);
            }
        });

        this.socket.on('error', (error) => {
            console.error('[MediaSoup] Server error:', error);
        });
    }

    public joinRoom(roomId: string): void {
        if (!this.socket) {
            console.error('[MediaSoup] Cannot join room: socket not connected');
            return;
        }

        console.log(`[MediaSoup] Attempting to join room ${roomId} with userId ${this._userId}`);

        this._roomId = roomId;
        this.socket.emit('join-room', { roomId, userId: this._userId });
    }

    private async createSendTransport(): Promise<void> {
        if (!this.socket) {
            console.error('[MediaSoup] Cannot create send transport: socket not connected');
            return;
        }

        console.log('[MediaSoup] Creating send transport');
        this.socket.emit('create-transport', { sender: true });
    }

    private async createRecvTransport(): Promise<void> {
        if (!this.socket) {
            console.error('[MediaSoup] Cannot create receive transport: socket not connected');
            return;
        }

        console.log('[MediaSoup] Creating receive transport');
        this.socket.emit('create-transport', { sender: false });
    }

    private async connectSendTransport(params: any): Promise<void> {
        try {
            console.log(`[MediaSoup] Connecting send transport: ${params.id}`);

            this._producerTransport = this._device.createSendTransport(params);

            this._producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
                console.log('[MediaSoup] Send transport connect event');
                try {
                    await this.socket?.emit('connect-transport', {
                        dtlsParameters,
                        transportId: this._producerTransport.id,
                        sender: true
                    });
                    callback();
                } catch (error) {
                    errback(error);
                }
            });

            this._producerTransport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
                console.log(`[MediaSoup] Send transport produce event, kind: ${kind}`);
                try {
                    this.socket?.emit('produce', {
                        transportId: this._producerTransport.id,
                        kind,
                        rtpParameters,
                        appData
                    });

                    // The server will respond with 'producer-created'
                    this.socket?.once('producer-created', ({ id }) => {
                        callback({ id });
                    });
                } catch (error) {
                    errback(error);
                }
            });

            console.log('[MediaSoup] Send transport connected');

        } catch (error) {
            console.error('[MediaSoup] Error connecting send transport:', error);
        }
    }

    private async connectRecvTransport(params: any): Promise<void> {
        try {
            console.log(`[MediaSoup] Connecting receive transport: ${params.id}`);

            this._consumerTransport = this._device.createRecvTransport(params);

            this._consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
                console.log('[MediaSoup] Receive transport connect event');
                try {
                    await this.socket?.emit('connect-transport', {
                        dtlsParameters,
                        transportId: this._consumerTransport.id,
                        sender: false
                    });
                    callback();
                } catch (error) {
                    errback(error);
                }
            });

            console.log('[MediaSoup] Receive transport connected');

        } catch (error) {
            console.error('[MediaSoup] Error connecting receive transport:', error);
        }
    }

    public async produceAudio(): Promise<any> {
        try {
            if (!this._producerTransport) {
                console.error('[MediaSoup] Cannot produce audio: Send transport not created');
                return null;
            }

            console.log('[MediaSoup] Starting audio production...');

            // Request access to the microphone
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('[MediaSoup] Got user media stream:', stream);

            this._localStream = stream;

            // Store the audio track
            const track = stream.getAudioTracks()[0];
            if (!track) {
                console.error('[MediaSoup] No audio track found in user media');
                return null;
            }

            console.log('[MediaSoup] Audio track obtained:', track.label);

            // Create the producer
            // Create the producer
            this._producer = await this._producerTransport.produce({
                track,
                codecOptions: {
                    opusStereo: true,
                    opusDtx: true,
                }
            });

            console.log('[MediaSoup] Audio producer created:', this._producer.id);

            this._producer.on('transportclose', () => {
                console.log('[MediaSoup] Producer transport closed');
                this._producer = null;
            });

            this._producer.on('trackended', () => {
                console.log('[MediaSoup] Producer track ended');
                this.closeProducer();
            });

            // Add the producer to our peers map (ourselves)
            const localPeer = this.getOrCreatePeer(this._userId);
            localPeer.hasAudioStream = true;

            console.log('[MediaSoup] Updated local peer state:', localPeer);

            return this._producer;

        } catch (error) {
            console.error('[MediaSoup] Error producing audio:', error);
            throw error;
        }
    }

    private async consume(producerId: string, producerUserId: string): Promise<void> {
        try {
            if (!this._consumerTransport) {
                console.error('[MediaSoup] Cannot consume: Receive transport not created');
                return;
            }

            console.log(`[MediaSoup] Consuming from producer ${producerId} (user ${producerUserId})`);

            // Request to consume the producer
            this.socket?.emit('consume', {
                transportId: this._consumerTransport.id,
                producerId,
                rtpCapabilities: this._device.rtpCapabilities,
                producerUserId
            });

        } catch (error) {
            console.error('[MediaSoup] Error consuming:', error);
        }
    }

    private resumeConsumer(consumerId: string): void {
        console.log(`[MediaSoup] Resuming consumer: ${consumerId}`);
        this.socket?.emit('consumer-resume', { consumerId });
    }

    private closeProducer(): void {
        if (!this._producer) return;

        console.log('[MediaSoup] Closing producer');

        try {
            this._producer.close();
            this._producer = null;

            if (this._localStream) {
                this._localStream.getTracks().forEach(track => track.stop());
                this._localStream = null;
            }

            // Update our local peer status
            const localPeer = this.getOrCreatePeer(this._userId);
            localPeer.hasAudioStream = false;

            // Trigger the callback
            this.onLocalAudioStateChanged?.(false);

        } catch (error) {
            console.error('[MediaSoup] Error closing producer:', error);
        }
    }

    public close(): void {
        console.log('[MediaSoup] Closing MediaSoup client');

        this.closeProducer();

        this._consumers.forEach(consumer => {
            try {
                consumer.close();
            } catch (error) {
                console.warn('[MediaSoup] Error closing consumer:', error);
            }
        });
        this._consumers.clear();

        if (this._producerTransport) {
            try {
                this._producerTransport.close();
            } catch (error) {
                console.warn('[MediaSoup] Error closing producer transport:', error);
            }
            this._producerTransport = null;
        }

        if (this._consumerTransport) {
            try {
                this._consumerTransport.close();
            } catch (error) {
                console.warn('[MediaSoup] Error closing consumer transport:', error);
            }
            this._consumerTransport = null;
        }

        this._remotePeers.clear();

        if (this.socket) {
            this.socket.off();
            this.socket.disconnect();
            this.socket = null;
        }
    }

    private getOrCreatePeer(userId: string): RemotePeer {
        let peer = this._remotePeers.get(userId);

        if (!peer) {
            peer = {
                id: userId,
                userId,
                hasAudioStream: false
            };
            this._remotePeers.set(userId, peer);
            console.log(`[MediaSoup] Created new peer object for ${userId}`);
        }

        return peer;
    }

    // Getters for external use

    public getRemotePeers(): Map<string, RemotePeer> {
        return this._remotePeers;
    }

    public getLocalAudioState(): boolean {
        return !!this._producer;
    }

    public getUserId(): string {
        return this._userId;
    }

    public getRoomId(): string {
        return this._roomId;
    }

    public isConnected(): boolean {
        return this.socket?.connected || false;
    }

    public async toggleAudio(): Promise<boolean> {
        if (this._producer) {
            this.closeProducer();
            return false;
        } else {
            await this.produceAudio();
            return true;
        }
    }
}
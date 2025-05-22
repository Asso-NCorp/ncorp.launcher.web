// mediasoup-server.js avec ES Modules

import express from 'express';
import https from 'https';
import fs from 'fs';
import { Server } from 'socket.io';
import * as mediasoup from 'mediasoup';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configuration des chemins pour ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());

// Use https with certs
const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, '../certs/dev-launcher.n-lan.com.key')),
    cert: fs.readFileSync(path.join(__dirname, '../certs/dev-launcher.n-lan.com.crt'))
};

const server = https.createServer(httpsOptions, app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// MediaSoup settings
const mediasoupSettings = {
    worker: {
        rtcMinPort: 40000,
        rtcMaxPort: 49999,
        logLevel: 'warn',
        logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp']
    },
    router: {
        mediaCodecs: [
            {
                kind: 'audio',
                mimeType: 'audio/opus',
                clockRate: 48000,
                channels: 2
            }
        ]
    }
};

// Global variables
let worker;
const rooms = new Map(); // Map room ID -> room state

// Room structure
class Room {
    constructor(id) {
        this.id = id;
        this.router = null;
        this.users = new Map(); // userId -> user info
        this.producers = new Map(); // producerId -> producer info
        console.log(`Created room: ${id}, with empty users list`);
    }
}

// User structure
class User {
    constructor(id, socketId) {
        this.id = id;
        this.socketId = socketId;
        this.transports = new Map(); // transportId -> transport
        this.producers = new Map(); // producerId -> producer
        this.consumers = new Map(); // consumerId -> consumer
        console.log(`Created user: ${id} with socket ${socketId}`);
    }
}

// Start MediaSoup
async function startMediasoup() {
    try {
        console.log('Starting MediaSoup worker...');
        worker = await mediasoup.createWorker(mediasoupSettings.worker);

        worker.on('died', () => {
            console.error('MediaSoup worker died, exiting...');
            process.exit(1);
        });

        console.log('MediaSoup worker started');
    } catch (error) {
        console.error('Failed to start MediaSoup worker:', error);
        process.exit(1);
    }
}

// Create or get a room
async function getOrCreateRoom(roomId) {
    let room = rooms.get(roomId);

    if (!room) {
        console.log(`Creating room: ${roomId}`);
        room = new Room(roomId);
        room.router = await worker.createRouter(mediasoupSettings.router);
        rooms.set(roomId, room);
    } else {
        console.log(`Using existing room: ${roomId} with ${room.users.size} users`);
        console.log(`Current users in room: ${Array.from(room.users.keys()).join(', ') || 'none'}`);
    }

    return room;
}

// Socket.IO connection handler
io.on('connection', async (socket) => {
    console.log('New client connected:', socket.id);

    let currentRoom = null;
    let currentUser = null;

    // Handle room join
    socket.on('join-room', async ({ roomId, userId }) => {
        try {
            console.log(`User ${userId} is joining room ${roomId}`);

            // Create or get the room
            currentRoom = await getOrCreateRoom(roomId);

            // Check if user already exists (reconnection)
            let user = currentRoom.users.get(userId);

            if (user) {
                // Update socket ID for existing user (reconnection case)
                user.socketId = socket.id;
                console.log(`User ${userId} reconnected with new socket ID: ${socket.id}`);
            } else {
                // Create a new user
                user = new User(userId, socket.id);
                currentRoom.users.set(userId, user);
                console.log(`Added new user ${userId} to room ${roomId}, now ${currentRoom.users.size} users`);
            }

            currentUser = user;

            // Join the socket to the room
            await socket.join(roomId);

            // Debug which rooms this socket is in
            const socketRooms = Array.from(socket.rooms);
            console.log(`Socket ${socket.id} is now in rooms: ${socketRooms.join(', ')}`);

            // Get all sockets in this room to verify
            const socketsInRoom = await io.in(roomId).fetchSockets();
            console.log(`Sockets in room ${roomId}: ${socketsInRoom.length}`);

            // Notify all clients in the room that a new user joined
            socket.to(roomId).emit('user-joined', { userId });

            // Tell the new user about all other users already in the room
            const existingUsers = [...currentRoom.users.keys()].filter(id => id !== userId);
            if (existingUsers.length > 0) {
                console.log(`Sending existing ${existingUsers.length} users to new user ${userId}:`, existingUsers);
                socket.emit('existing-users', { users: existingUsers });
            }

            // Send router capabilities to the new user
            socket.emit('router-rtpCapabilities', currentRoom.router.rtpCapabilities);

            // Notify the new client about existing producers
            for (const [producerId, producer] of currentRoom.producers) {
                // Only notify about producers from other users
                if (producer.userId !== userId) {
                    console.log(`Notifying new user ${userId} about existing producer ${producerId} from ${producer.userId}`);
                    socket.emit('new-producer', {
                        producerId: producerId,
                        producerUserId: producer.userId,
                        kind: producer.kind || 'audio'
                    });
                }
            }

        } catch (error) {
            console.error('Error joining room:', error);
            socket.emit('error', { message: 'Failed to join room', error: error.message });
        }
    });

    // Handle transport creation
    socket.on('create-transport', async ({ sender }) => {
        try {
            if (!currentRoom || !currentUser) {
                throw new Error('User not in a room');
            }

            console.log(`Creating ${sender ? 'send' : 'receive'} transport for user ${currentUser.id}`);

            // Create a WebRTC transport
            const transport = await currentRoom.router.createWebRtcTransport({
                listenIps: [{ ip: '0.0.0.0', announcedIp: '192.168.1.117' }],
                enableUdp: true,
                enableTcp: true,
                preferUdp: true
            });

            // Store the transport
            currentUser.transports.set(transport.id, transport);

            // Listen for transport close event
            transport.on('routerclose', () => {
                console.log(`Transport ${transport.id} closed due to router close`);
                transport.close();
                currentUser.transports.delete(transport.id);
            });

            // Send transport parameters to the client
            socket.emit('transport-created', {
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters,
                sender
            });

        } catch (error) {
            console.error('Error creating transport:', error);
            socket.emit('error', { message: 'Failed to create transport', error: error.message });
        }
    });

    // Handle transport connection
    socket.on('connect-transport', async ({ dtlsParameters, transportId, sender }) => {
        try {
            if (!currentRoom || !currentUser) {
                throw new Error('User not in a room');
            }

            console.log(`Connecting ${sender ? 'send' : 'receive'} transport ${transportId} for user ${currentUser.id}`);

            const transport = currentUser.transports.get(transportId);

            if (!transport) {
                throw new Error(`Transport ${transportId} not found`);
            }

            // Connect the transport
            await transport.connect({ dtlsParameters });

            console.log(`Transport ${transportId} connected successfully`);

            socket.emit('transport-connected', { transportId });

        } catch (error) {
            console.error('Error connecting transport:', error);
            socket.emit('error', { message: 'Failed to connect transport', error: error.message });
        }
    });

    // Handle producer creation
    socket.on('produce', async ({ transportId, kind, rtpParameters, appData }) => {
        try {
            if (!currentRoom || !currentUser) {
                throw new Error('User not in a room');
            }

            console.log(`User ${currentUser.id} is producing ${kind}`);

            const transport = currentUser.transports.get(transportId);

            if (!transport) {
                throw new Error(`Transport ${transportId} not found`);
            }

            // Logs détaillés
            console.log(`Producing ${kind} on transport ${transportId}`);
            console.log('RTP parameters:', JSON.stringify(rtpParameters, null, 2));

            // Create a producer
            const producer = await transport.produce({
                kind,
                rtpParameters,
                appData: { ...appData, userId: currentUser.id }
            });

            // Store the producer
            currentUser.producers.set(producer.id, producer);

            // Store in room producers as well
            currentRoom.producers.set(producer.id, {
                id: producer.id,
                userId: currentUser.id,
                producer: producer,
                kind: kind
            });

            // Listen for producer close
            producer.on('transportclose', () => {
                console.log(`Producer ${producer.id} closed due to transport close`);
                producer.close();
                currentUser.producers.delete(producer.id);
                currentRoom.producers.delete(producer.id);

                // Notify clients that this producer is gone
                io.to(currentRoom.id).emit('producer-closed', {
                    producerId: producer.id,
                    producerUserId: currentUser.id
                });
            });

            console.log(`Producer ${producer.id} created for user ${currentUser.id}`);
            console.log(`Room ${currentRoom.id} now has ${currentRoom.producers.size} producers`);

            // Notify the client of the producer ID
            socket.emit('producer-created', { id: producer.id });

            // Important: Log all clients in the room
            const clients = await io.in(currentRoom.id).fetchSockets();
            console.log(`Room ${currentRoom.id} has ${clients.length} connected clients`);

            // Notify all other clients in the room about new producer
            socket.to(currentRoom.id).emit('new-producer', {
                producerId: producer.id,
                producerUserId: currentUser.id,
                kind: kind
            });

        } catch (error) {
            console.error('Error creating producer:', error);
            socket.emit('error', { message: 'Failed to create producer', error: error.message });
        }
    });

    // Handle consumer creation
    socket.on('consume', async ({ transportId, producerId, rtpCapabilities, producerUserId }) => {
        try {
            if (!currentRoom || !currentUser) {
                throw new Error('User not in a room');
            }

            console.log(`User ${currentUser.id} wants to consume producer ${producerId} from ${producerUserId}`);

            const transport = currentUser.transports.get(transportId);

            if (!transport) {
                throw new Error(`Transport ${transportId} not found`);
            }

            // Check if the client can consume this producer
            if (!currentRoom.router.canConsume({
                producerId,
                rtpCapabilities
            })) {
                throw new Error(`Client cannot consume producer ${producerId}`);
            }

            // Create a consumer
            const consumer = await transport.consume({
                producerId,
                rtpCapabilities,
                paused: true // We'll let the client unpause it
            });

            // Store the consumer
            currentUser.consumers.set(consumer.id, consumer);

            // Listen for consumer close
            consumer.on('transportclose', () => {
                console.log(`Consumer ${consumer.id} closed due to transport close`);
                consumer.close();
                currentUser.consumers.delete(consumer.id);
            });

            // Listen for producer close
            consumer.on('producerclose', () => {
                console.log(`Consumer ${consumer.id} closed due to producer close`);
                consumer.close();
                currentUser.consumers.delete(consumer.id);

                // Notify the client that the producer closed
                socket.emit('producer-closed', {
                    consumerId: consumer.id,
                    producerId,
                    producerUserId
                });
            });

            console.log(`Consumer ${consumer.id} created for user ${currentUser.id} to consume producer ${producerId}`);

            // Get original producer owner userId
            const producerInfo = currentRoom.producers.get(producerId);
            const producerOwnerUserId = producerInfo ? producerInfo.userId : producerUserId;

            // Notify the client of the consumer
            socket.emit('consumer-created', {
                id: consumer.id,
                producerId,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
                producerUserId: producerOwnerUserId
            });

        } catch (error) {
            console.error('Error creating consumer:', error);
            socket.emit('error', { message: 'Failed to create consumer', error: error.message });
        }
    });

    // Handle consumer resume
    socket.on('consumer-resume', async ({ consumerId }) => {
        try {
            if (!currentRoom || !currentUser) {
                throw new Error('User not in a room');
            }

            const consumer = currentUser.consumers.get(consumerId);

            if (!consumer) {
                throw new Error(`Consumer ${consumerId} not found`);
            }

            // Resume the consumer
            await consumer.resume();

            console.log(`Consumer ${consumerId} resumed for user ${currentUser.id}`);
            socket.emit('consumer-resumed', { consumerId });

        } catch (error) {
            console.error('Error resuming consumer:', error);
            socket.emit('error', { message: 'Failed to resume consumer', error: error.message });
        }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
        console.log(`Client disconnected: ${socket.id}`);

        try {
            if (currentRoom && currentUser) {
                // Notify other clients that this user left
                socket.to(currentRoom.id).emit('user-left', { userId: currentUser.id });

                // Clean up resources
                for (const producer of currentUser.producers.values()) {
                    producer.close();
                    currentRoom.producers.delete(producer.id);
                }

                for (const consumer of currentUser.consumers.values()) {
                    consumer.close();
                }

                for (const transport of currentUser.transports.values()) {
                    transport.close();
                }

                // Remove the user from the room
                currentRoom.users.delete(currentUser.id);
                console.log(`User ${currentUser.id} removed from room ${currentRoom.id}, remaining users: ${currentRoom.users.size}`);

                // If the room is empty, consider cleaning it up
                if (currentRoom.users.size === 0) {
                    console.log(`Room ${currentRoom.id} is empty, keeping for future connections`);
                    // rooms.delete(currentRoom.id); // Optionnel: supprimer la room vide
                }
            }
        } catch (error) {
            console.error('Error handling disconnect:', error);
        }
    });
});

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../public')));

// Route de base pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
    res.send('MediaSoup Server is running!');
});

// Start the server
async function start() {
    try {
        await startMediasoup();

        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`Server HTTPS listening on port ${PORT}`);
        });

        // Optionnellement, démarrer aussi un serveur HTTP pour rediriger vers HTTPS
        if (process.env.HTTP_PORT) {
            const httpApp = express();
            httpApp.all('*', (req, res) => {
                res.redirect(`https://${req.headers.host}${req.url}`);
            });

            httpApp.listen(process.env.HTTP_PORT, () => {
                console.log(`HTTP redirect server listening on port ${process.env.HTTP_PORT}`);
            });
        }
    } catch (error) {
        console.error('Failed to start the server:', error);
        process.exit(1);
    }
}

start();

export interface RoomUser {
    id: string;
    speaking: boolean;
}

export interface TransportParams {
    id: string;
    iceParameters: any;
    iceCandidates: any;
    dtlsParameters: any;
    sender: boolean;
}

export interface ConsumerParams {
    id: string;
    producerId: string;
    kind: 'audio' | 'video';
    rtpParameters: any;
}

export interface JoinRoomParams {
    roomId: string;
    userId: string;
}

export interface NewProducerParams {
    producerId: string;
    producerUserId: string;
}

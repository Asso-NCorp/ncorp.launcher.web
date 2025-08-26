export type ChatServer = {
    id: string;
    name: string;
    icon_url?: string;
    order?: number;
};

export type ChatChannel = {
    id: string;
    server_id: string;
    name: string;
    type: "text" | "voice";
    topic?: string;
    order?: number;
};

export type ChatMessage = {
    id: string;
    channel_id: string;
    author_id: string;
    author_name: string;
    content: string;
    created_at: string;
    temp?: boolean;
    dm_id?: string;
};

export type DirectConversation = {
    id: string;
    participant_ids: string[];
    title?: string;
};

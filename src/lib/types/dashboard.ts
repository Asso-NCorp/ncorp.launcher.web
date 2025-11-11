export type UserInfo = {
    id: string;
    name: string;
    displayUsername: string | null;
    image: string | null;
    role?: string | null;
};

export type GameSession = {
    id: string;
    user_id: string;
    game_slug: string;
    start_time: Date | string;
    end_time: Date | string | null;
    total_seconds: number | null;
    user: UserInfo;
    game?: {
        name?: string;
        image?: string;
    };
};

export type GroupedGameDay = {
    date: string;
    displayDate: any; // dayjs.Dayjs
    games: Record<string, GroupedGameSession>;
};

export type GroupedGameSession = {
    game_slug: string;
    totalSeconds: number;
    sessionCount: number;
    lastSession: string;
};

export type LeaderboardUser = {
    id: string;
    name: string;
    displayUsername: string | null;
    image: string | null;
    totalPlayTime: number;
    isCurrentUser: boolean;
    sessionCount?: number;
    decoration?: string | null;
};

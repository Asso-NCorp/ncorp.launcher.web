import { PRIVATE_SERVER_DETECTOR_URL } from "$env/static/private";
import { GamesStore } from "../states/games.svelte";
import type { InstallableGameExtended } from "../types";

export interface DetectedServer {
    gameSlug: string;
    port: number;
    type: string;
    processName: string;
    pid: number;
    startTime: string;
    uptime: string;
    memoryMb: number;
}

export interface DetectedServerWithGame extends DetectedServer {
    game?: InstallableGameExtended;
}

/**
 * Fetches live servers from the detector API
 * @returns Array of detected servers
 */
export async function fetchLiveServers(): Promise<DetectedServer[]> {
    const response = await fetch(PRIVATE_SERVER_DETECTOR_URL);

    if (!response.ok) {
        throw new Error(`Failed to fetch live servers: ${response.statusText}`);
    }

    const servers: DetectedServer[] = await response.json();
    return servers;
}

/**
 * Enriches detected servers with game data from GamesStore
 * @param servers Array of detected servers
 * @returns Array of servers with optional game information
 */
export function enrichServersWithGames(servers: DetectedServer[]): DetectedServerWithGame[] {
    return servers.map((server) => ({
        ...server,
        game: GamesStore.get(server.gameSlug),
    }));
}

/**
 * Fetches live servers from the detector API and enriches them with game data from GamesStore
 * @returns Array of detected servers with optional game information
 */
export async function getLiveServers(): Promise<DetectedServerWithGame[]> {
    try {
        const servers = await fetchLiveServers();
        return enrichServersWithGames(servers);
    } catch (error) {
        console.error("Error fetching live servers:", error);
        throw error;
    }
}

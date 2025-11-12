import { query } from "$app/server";
import { fetchLiveServers } from "$lib/utils/liveServers";

// Re-export the types for convenience
export type { DetectedServer, DetectedServerWithGame } from "$lib/utils/liveServers";

/**
 * Remote function to fetch live servers from the detector API
 * This wraps the utility function to make it available as a SvelteKit remote function
 * @returns Array of detected servers
 */
export const getLiveServers = query(async () => {
    return await fetchLiveServers();
});

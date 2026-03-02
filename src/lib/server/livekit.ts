/**
 * Server-side LiveKit helpers.
 *
 * Reads LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET from
 * `$env/dynamic/private` so the values are never bundled into the client.
 */

import { env } from "$env/dynamic/private";

/** LiveKit env vars — may be undefined if not configured. */
export function getLivekitEnv() {
    return {
        url: env.LIVEKIT_URL, // ws(s)://…
        apiKey: env.LIVEKIT_API_KEY,
        apiSecret: env.LIVEKIT_API_SECRET,
    };
}

/**
 * Convert a WebSocket URL to its HTTP(S) equivalent.
 *   ws://host:port  → http://host:port
 *   wss://host:port → https://host:port
 */
export function wsToHttp(wsUrl: string): string {
    return wsUrl.replace(/^ws(s?):\/\//, "http$1://");
}

import { json, error, type RequestHandler } from "@sveltejs/kit";
import { AccessToken } from "livekit-server-sdk";
import { env } from "$env/dynamic/private";

/**
 * POST /api/livekit-token
 *
 * Body: { room?: string }
 * Returns: { token: string, url: string, identity: string }
 *
 * The identity is derived from the authenticated Better Auth user.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
    const url = env.LIVEKIT_URL;
    const apiKey = env.LIVEKIT_API_KEY;
    const apiSecret = env.LIVEKIT_API_SECRET;

    if (!url || !apiKey || !apiSecret) {
        return error(500, "LiveKit is not configured on this server.");
    }

    if (!locals.user) {
        return error(401, "Not authenticated.");
    }

    let body: { room?: string };
    try {
        body = await request.json();
    } catch {
        return error(400, "Invalid JSON body.");
    }

    const room = body.room?.trim() || "lobby";
    const identity = locals.user.id;
    const name = locals.user.name || locals.user.email || identity;

    const token = new AccessToken(apiKey, apiSecret, {
        identity,
        name,
        ttl: "10m",
    });

    token.addGrant({
        roomJoin: true,
        room,
    });

    const jwt = await token.toJwt();

    return json({ token: jwt, url, identity });
};

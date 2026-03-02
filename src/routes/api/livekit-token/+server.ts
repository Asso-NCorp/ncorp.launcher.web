import { json, error, type RequestHandler } from "@sveltejs/kit";
import { AccessToken } from "livekit-server-sdk";
import { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } from "$env/static/private";

/**
 * POST /api/livekit-token
 *
 * Body: { room?: string }
 * Returns: { token: string, url: string, identity: string }
 *
 * The identity is derived from the authenticated Better Auth user.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
    if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
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

    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
        identity,
        name,
        ttl: "10m",
    });

    token.addGrant({
        roomJoin: true,
        room,
    });

    const jwt = await token.toJwt();

    return json({ token: jwt, url: LIVEKIT_URL, identity });
};

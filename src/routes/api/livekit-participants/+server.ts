import { json, error, type RequestHandler } from "@sveltejs/kit";
import { RoomServiceClient } from "livekit-server-sdk";
import { getLivekitEnv, wsToHttp } from "$lib/server/livekit";

/**
 * GET /api/livekit-participants?room=<name>
 *
 * Returns an array of { identity, name } for every participant
 * currently in the given LiveKit room.
 * If the room does not exist yet, returns [].
 */
export const GET: RequestHandler = async ({ url, locals }) => {
    const { url: livekitUrl, apiKey, apiSecret } = getLivekitEnv();

    if (!livekitUrl || !apiKey || !apiSecret) {
        return error(500, "LiveKit is not configured on this server.");
    }

    if (!locals.user) {
        return error(401, "Not authenticated.");
    }

    const room = url.searchParams.get("room")?.trim();
    if (!room) {
        return error(400, "Missing ?room= query parameter.");
    }

    const httpUrl = wsToHttp(livekitUrl);
    const roomService = new RoomServiceClient(httpUrl, apiKey, apiSecret);

    try {
        const participants = await roomService.listParticipants(room);
        const result = participants.map((p) => ({
            identity: p.identity,
            name: p.name ?? p.identity,
        }));
        return json(result);
    } catch {
        // Room doesn't exist yet — LiveKit throws; return empty array
        return json([]);
    }
};

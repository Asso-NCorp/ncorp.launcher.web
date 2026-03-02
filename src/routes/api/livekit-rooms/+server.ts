import { json, error, type RequestHandler } from "@sveltejs/kit";
import { RoomServiceClient } from "livekit-server-sdk";
import { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } from "$env/static/private";
import { logger } from "better-auth";

function wsToHttp(wsUrl: string): string {
    return wsUrl.replace(/^ws(s?):\/\//, "http$1://");
}

/**
 * GET /api/livekit-rooms
 *
 * Returns a map of roomName → participants[] for all active LiveKit rooms.
 * { [roomName: string]: { identity: string, name: string }[] }
 */
export const GET: RequestHandler = async ({ locals }) => {
    if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
        return json({});
    }

    if (!locals.user) {
        return error(401, "Not authenticated.");
    }

    const httpUrl = wsToHttp(LIVEKIT_URL);
    const roomService = new RoomServiceClient(httpUrl, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

    try {
        const rooms = await roomService.listRooms();

        const result: Record<string, { identity: string; name: string }[]> = {};

        await Promise.all(
            rooms.map(async (room) => {
                try {
                    const participants = await roomService.listParticipants(room.name);
                    if (participants.length > 0) {
                        result[room.name] = participants.map((p) => ({
                            identity: p.identity,
                            name: p.name ?? p.identity,
                        }));
                    }
                } catch {
                    // Room may have been destroyed between list and fetch
                }
            }),
        );

        return json(result);
    } catch {
        return json({});
    }
};

import { json, error, type RequestHandler } from "@sveltejs/kit";
import { RoomServiceClient, DataPacket_Kind } from "livekit-server-sdk";
import { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } from "$env/static/private";

function wsToHttp(wsUrl: string): string {
    return wsUrl.replace(/^ws(s?):\/\//, "http$1://");
}

/**
 * POST /api/livekit-admin
 *
 * Admin-only endpoint for participant management.
 *
 * Body (remove):  { action: "remove", room: string, identity: string }
 * Body (move):    { action: "move",   room: string, identity: string, targetRoom: string }
 *
 * "move" sends an admin:move data message to the participant's client so it
 * reconnects to targetRoom automatically, without a forced kick.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== "admin") {
        return error(403, "Forbidden.");
    }

    if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
        return error(500, "LiveKit is not configured.");
    }

    let body: { action: string; room: string; identity: string; targetRoom?: string };
    try {
        body = await request.json();
    } catch {
        return error(400, "Invalid JSON body.");
    }

    const { action, room, identity, targetRoom } = body;
    if (!action || !room || !identity) {
        return error(400, "Missing required fields: action, room, identity.");
    }

    const roomService = new RoomServiceClient(wsToHttp(LIVEKIT_URL), LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

    try {
        if (action === "remove") {
            await roomService.removeParticipant(room, identity);
            return json({ ok: true });
        }

        if (action === "move") {
            if (!targetRoom) return error(400, "targetRoom is required for move.");
            const payload = new TextEncoder().encode(
                JSON.stringify({ type: "admin:move", room: targetRoom }),
            );
            await roomService.sendData(room, payload, DataPacket_Kind.RELIABLE, {
                destinationIdentities: [identity],
            });
            return json({ ok: true });
        }

        return error(400, `Unknown action: ${action}`);
    } catch (e: any) {
        return error(500, e?.message ?? "LiveKit error.");
    }
};

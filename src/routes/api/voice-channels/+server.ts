import { json, error, type RequestHandler } from "@sveltejs/kit";
import { db } from "$srv/db";

/**
 * GET /api/voice-channels?guildId=<id>
 *
 * Returns voice channels for a guild, each with its linked room id.
 * Used by the chat controller to show voice channels in the channel list.
 */
export const GET: RequestHandler = async ({ url, locals }) => {
    if (!locals.user) {
        return error(401, "Not authenticated.");
    }

    const guildId = url.searchParams.get("guildId")?.trim();
    if (!guildId) {
        return error(400, "Missing ?guildId= query parameter.");
    }

    try {
        const channels = await db.channel.findMany({
            where: {
                guildId,
                type: "VOICE",
            },
            include: {
                room: {
                    select: { id: true },
                },
            },
            orderBy: { position: "asc" },
        });

        const result = channels.map((ch) => ({
            id: ch.room?.id ?? ch.id, // prefer room id (used as channel id in chat)
            channelId: ch.id,
            name: ch.name,
            type: "voice" as const,
        }));

        return json(result);
    } catch (e: any) {
        console.error("[voice-channels] Error:", e);
        return json([]);
    }
};

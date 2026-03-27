import { json, type RequestEvent, type RequestHandler } from "@sveltejs/kit"
import { db } from "$srv/db";

export const GET: RequestHandler = async (event: RequestEvent) => {

    const id = event.params.id;
    if (!id) {
        return json({ error: 'Channel ID is required' }, { status: 400 });
    }

    // Find the room linked to this channel
    const room = await db.room.findFirst({
        where: { channelId: id },
        select: { id: true }
    });

    if (!room) {
        return json({ error: 'Room not found for this channel' }, { status: 404 });
    }

    const messages = await db.message.findMany({
        where: {
            roomId: room.id
        },
        orderBy: {
            createdAt: "desc",
        },
        select: {
            id: true,
            roomId: true,
            authorId: true,
            content: true,
            createdAt: true,
            author: {
                select: {
                    id: true,
                    name: true
                }
            }
        },
        take: 30,
    });

    // Return messages in chronological order
    messages.reverse();

    return json(messages);
}
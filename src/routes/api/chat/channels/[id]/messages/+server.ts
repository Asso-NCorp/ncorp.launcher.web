import { json, type RequestEvent, type RequestHandler } from "@sveltejs/kit"
import { db } from "$srv/db";

export const GET: RequestHandler = async (event: RequestEvent) => {

    const id = event.params.id;
    if (!id) {
        return json({ error: 'Server ID is required' }, { status: 400 });
    }

    const messages = await db.chat_message.findMany({
        where: {
            channelId: parseInt(id)
        },
        orderBy: {
            timestamp: "desc",
        },
        select: {
            id: true,
            channelId: true,
            senderId: true,
            text: true,
            timestamp: true,
            user: {
                select: {
                    id: true,
                    name: true
                }
            }
        },
        take: 30,
    });

    // Retourner l'order des messages
    messages.reverse();

    return json(messages);
}
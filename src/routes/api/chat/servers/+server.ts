import { db } from "$srv/db";
import type { ChatServerWithChannels } from "$srv/routes/chat";
import { json, type RequestHandler } from "@sveltejs/kit"


export const GET: RequestHandler = async () => {

    const servers = await db.chat_server.findMany({
        include: {
            chat_channel: true
        }
    }) as ChatServerWithChannels[];

    return json(servers);
}
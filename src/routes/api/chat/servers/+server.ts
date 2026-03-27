import { db } from "$srv/db";
import { json, type RequestHandler } from "@sveltejs/kit"


export const GET: RequestHandler = async () => {

    const servers = await db.guild.findMany({
        include: {
            channels: true
        }
    });

    return json(servers);
}
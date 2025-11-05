import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { db } from "$srv/db";
import { deleteRoom } from "$lib/server/table-plan";

export const GET: RequestHandler = async ({ locals, params }) => {
    try {
        const room = await db.edition_room.findUnique({
            where: { id: params.roomId! },
            include: {
                tables: {
                    include: {
                        seats: true,
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        });

        if (!room) {
            return json({ error: "Room not found" }, { status: 404 });
        }

        return json(room);
    } catch (error) {
        console.error("Error fetching room:", error);
        return json({ error: "Failed to fetch room" }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
    await deleteRoom(params.roomId!);
    return json({ success: true });
};

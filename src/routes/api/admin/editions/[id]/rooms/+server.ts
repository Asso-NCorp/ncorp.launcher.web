import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { createRoom, updateRoom, deleteRoom } from "$lib/server/table-plan";

export const POST: RequestHandler = async ({ locals, params, request }) => {
    const body = await request.json();
    const room = await createRoom(params.id!, body.name);

    return json(room, { status: 201 });
};

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
    const body = await request.json();
    const room = await updateRoom(params.roomId!, body.name);

    return json(room);
};

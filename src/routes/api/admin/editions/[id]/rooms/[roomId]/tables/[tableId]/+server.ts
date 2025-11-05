import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { updateTable, deleteTable } from "$lib/server/table-plan";

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
    const body = await request.json();

    const table = await updateTable(params.tableId!, {
        name: body.name,
        positionX: body.positionX,
        positionY: body.positionY,
        width: body.width,
        height: body.height,
        capacity: body.capacity,
    });

    return json(table);
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
    await deleteTable(params.tableId!);
    return json({ success: true });
};

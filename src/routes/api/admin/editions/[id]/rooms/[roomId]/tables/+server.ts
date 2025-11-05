import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { createTable, updateTablesPositionBulk } from "$lib/server/table-plan";

export const POST: RequestHandler = async ({ locals, params, request }) => {
    const body = await request.json();
    const table = await createTable(
        params.roomId!,
        body.name,
        body.positionX, // Pass undefined if not provided, so auto-placement kicks in
        body.positionY,
        body.width,
        body.height,
        body.capacity,
    );

    return json(table, { status: 201 });
};

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
    const body = await request.json();

    if (body.bulkUpdate && Array.isArray(body.updates)) {
        // Bulk update positions
        await updateTablesPositionBulk(body.updates);
        return json({ success: true });
    }

    return json({ error: "Bad request" }, { status: 400 });
};

export const DELETE: RequestHandler = async () => {
    // This route should not handle individual DELETE requests
    // Use /tables/[tableId] instead
    return json({ error: "Use /tables/[tableId] for individual table operations" }, { status: 400 });
};

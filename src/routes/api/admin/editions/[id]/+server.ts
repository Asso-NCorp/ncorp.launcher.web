import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { getEdition, updateEdition, deleteEdition } from "$lib/server/table-plan";

export const GET: RequestHandler = async ({ locals, params }) => {
    const edition = await getEdition(params.id!);
    if (!edition) {
        return json({ error: "Not found" }, { status: 404 });
    }

    return json(edition);
};

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
    const body = await request.json();
    const edition = await updateEdition(params.id!, {
        name: body.name,
        description: body.description,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        updatedBy: locals.user!.id,
    });

    return json(edition);
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
    await deleteEdition(params.id!);
    return json({ success: true });
};

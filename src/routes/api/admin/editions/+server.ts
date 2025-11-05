import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { getEditions, createEdition, updateEdition, deleteEdition, getEdition } from "$lib/server/table-plan";

export const GET: RequestHandler = async ({ locals }) => {
    const editions = await getEditions();
    return json(editions);
};

export const POST: RequestHandler = async ({ locals, request }) => {
    const body = await request.json();
    const now = new Date();
    const edition = await createEdition({
        name: body.name,
        description: body.description || "",
        startDate: body.startDate ? new Date(body.startDate) : now,
        endDate: body.endDate ? new Date(body.endDate) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdBy: locals.user!.id,
        updatedBy: locals.user!.id,
    });

    return json(edition, { status: 201 });
};

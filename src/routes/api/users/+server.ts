import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { db } from "$srv/db";

export const GET: RequestHandler = async ({ locals }) => {
    try {
        const users = await db.user.findMany({
            select: {
                id: true,
                name: true,
                displayUsername: true,
                role: true,
                image: true,
            },
            orderBy: {
                name: "asc",
            },
        });

        return json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return json({ error: "Failed to fetch users" }, { status: 500 });
    }
};

import type { Actions, ServerLoad, RequestEvent } from "@sveltejs/kit";
import { db } from "$srv/db";
import { fail, redirect } from "@sveltejs/kit";
import { PUBLIC_SIGNIN_PATH } from "$env/static/public";

export const load: ServerLoad = async () => {
    const faqs = await db.faq.findMany({
        orderBy: { created_at: "desc" },
    });
    return { faqs };
};

export const actions = {
    create: async ({ request, locals, url }: RequestEvent) => {
        const data = await request.formData();
        const question = (data.get("question") || "").toString().trim();
        const answer = (data.get("answer") || "").toString().trim();
        const published = (data.get("published") || "on").toString() === "on"; // default published

        if (!question || !answer) {
            return fail(400, { message: "La question et la réponse sont obligatoires." });
        }

        const userId = locals.user?.id;
        if (!userId) {
            throw redirect(302, PUBLIC_SIGNIN_PATH);
        }

        await db.faq.create({
            data: {
                question,
                answer,
                published,
                created_by: userId,
                updated_by: userId,
            },
        });

        throw redirect(303, url.pathname);
    },
} satisfies Actions;

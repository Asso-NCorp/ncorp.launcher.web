import type { Actions, ServerLoad, RequestEvent } from "@sveltejs/kit";
import { db } from "$srv/db";
import { fail, redirect } from "@sveltejs/kit";
import { PUBLIC_SIGNIN_PATH } from "$env/static/public";

export const load: ServerLoad = async () => {
    const faqs = await db.faq.findMany({
        orderBy: [{ position: "asc" }, { created_at: "asc" }],
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

        // compute next position (append at end)
        const max = await db.faq.aggregate({ _max: { position: true } });
        const nextPos = (max._max.position ?? 0) + 1;

        await db.faq.create({
            data: {
                question,
                answer,
                published,
                position: nextPos,
                created_by: userId,
                updated_by: userId,
            },
        });

        throw redirect(303, url.pathname);
    },
    update: async ({ request, locals, url }: RequestEvent) => {
        const form = await request.formData();
        const id = Number(form.get("id"));
        if (!id || Number.isNaN(id)) return fail(400, { message: "ID invalide" });

        const question = (form.get("question") || "").toString().trim();
        const answer = (form.get("answer") || "").toString().trim();
        const published = (form.get("published") || "off").toString() === "on";

        if (!question || !answer) return fail(400, { message: "La question et la réponse sont obligatoires." });

        const userId = locals.user?.id;
        if (!userId) throw redirect(302, PUBLIC_SIGNIN_PATH);

        await db.faq.update({
            where: { id },
            data: {
                question,
                answer,
                published,
                updated_by: userId,
            },
        });

        throw redirect(303, url.pathname);
    },
    toggle: async ({ request, locals, url }: RequestEvent) => {
        const form = await request.formData();
        const id = Number(form.get("id"));
        if (!id || Number.isNaN(id)) return fail(400, { message: "ID invalide" });

        const userId = locals.user?.id;
        if (!userId) throw redirect(302, PUBLIC_SIGNIN_PATH);

        const record = await db.faq.findUnique({ where: { id }, select: { published: true } });
        if (!record) return fail(404, { message: "FAQ introuvable" });

        await db.faq.update({ where: { id }, data: { published: !record.published, updated_by: userId } });
        throw redirect(303, url.pathname);
    },
    delete: async ({ request, locals, url }: RequestEvent) => {
        const form = await request.formData();
        const id = Number(form.get("id"));
        if (!id || Number.isNaN(id)) return fail(400, { message: "ID invalide" });

        const userId = locals.user?.id;
        if (!userId) throw redirect(302, PUBLIC_SIGNIN_PATH);

        const exists = await db.faq.findUnique({ where: { id }, select: { id: true } });
        if (!exists) return fail(404, { message: "FAQ introuvable" });

        await db.faq.delete({ where: { id } });
        throw redirect(303, url.pathname);
    },
    move: async ({ request, locals, url }: RequestEvent) => {
        // Reorder using the dedicated position column.
        const form = await request.formData();
        const id = Number(form.get("id"));
        const direction = (form.get("direction") || "").toString(); // "up" | "down"
        if (!id || Number.isNaN(id) || (direction !== "up" && direction !== "down"))
            return fail(400, { message: "Paramètres invalides" });

        const userId = locals.user?.id;
        if (!userId) throw redirect(302, PUBLIC_SIGNIN_PATH);

        let faqs = await db.faq.findMany({
            orderBy: [{ position: "asc" }, { created_at: "asc" }],
            select: { id: true, position: true },
        });

        // If positions are duplicated (e.g., all 0 after migration), normalize first
        const uniqueCount = new Set(faqs.map((f) => f.position)).size;
        if (uniqueCount !== faqs.length) {
            await db.$transaction(
                faqs.map((f, idx) =>
                    db.faq.update({ where: { id: f.id }, data: { position: idx + 1, updated_by: userId } }),
                ),
            );
            faqs = await db.faq.findMany({ orderBy: { position: "asc" }, select: { id: true, position: true } });
        }

        const index = faqs.findIndex((f) => f.id === id);
        if (index === -1) return fail(404, { message: "FAQ introuvable" });

        const swapWith = direction === "up" ? index - 1 : index + 1;
        if (swapWith < 0 || swapWith >= faqs.length) return redirect(303, url.pathname);

        const a = faqs[index];
        const b = faqs[swapWith];

        await db.$transaction([
            db.faq.update({ where: { id: a.id }, data: { position: b.position, updated_by: userId } }),
            db.faq.update({ where: { id: b.id }, data: { position: a.position, updated_by: userId } }),
        ]);

        throw redirect(303, url.pathname);
    },
} satisfies Actions;

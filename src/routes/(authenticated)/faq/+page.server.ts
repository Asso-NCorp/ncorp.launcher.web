import type { PageServerLoad } from "./$types";
import { db } from "$srv/db";

export const load: PageServerLoad = async () => {
    const faqs = await db.faq.findMany({
        where: { published: true },
        orderBy: [{ position: "asc" }, { created_at: "asc" }],
    });
    return { faqs };
};

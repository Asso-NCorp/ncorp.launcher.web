import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { forgotPasswordSchema } from "../schemas";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
    const form = await superValidate(zod4(forgotPasswordSchema));
    return { form };
};

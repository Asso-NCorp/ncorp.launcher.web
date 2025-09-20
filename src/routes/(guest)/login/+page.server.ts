import { PUBLIC_OAUTH2_REDIRECT_URI } from "$env/static/public";
import { auth } from "$src/lib/auth/server";
import { logger } from "better-auth";
import type { PageServerLoad } from "../signin/$types";
import { redirect } from "@sveltejs/kit";

/* export const load: PageServerLoad = async (event) => {
    const { url } = await auth.api.signInWithOAuth2({
        body: {
            providerId: "nlan",
            callbackURL: PUBLIC_OAUTH2_REDIRECT_URI,
        },
        asResponse: true,
    });

    logger.info(`Redirecting to OAuth2 provider: ${url}`);

    throw redirect(302, url);
};
 */

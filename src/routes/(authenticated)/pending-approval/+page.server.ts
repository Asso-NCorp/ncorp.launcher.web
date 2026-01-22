import { redirect } from "@sveltejs/kit";
import { PUBLIC_SIGNIN_PATH } from "$env/static/public";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
    // If user is approved, redirect to home
    if (locals.user?.approvalStatus === "approved") {
        redirect(302, "/");
    }

    // If user is rejected, redirect to sign in
    if (locals.user?.approvalStatus === "rejected") {
        redirect(302, PUBLIC_SIGNIN_PATH);
    }

    return {
        email: locals.user?.email,
        username: locals.user?.username,
        approvalStatus: locals.user?.approvalStatus,
    };
};

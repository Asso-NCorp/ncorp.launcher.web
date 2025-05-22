import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { logger } from '$src/lib/stores/loggerStore';
import { getServerApi } from '$src/lib/utils';
import { type LiveUser } from '$src/lib/shared-models';
export const load: LayoutServerLoad = async ({ locals, request, cookies }) => {
    const session = locals.session;
    const user = locals.user;
    const localGamesDir = locals.localGamesDir;

    if (!session) {
        logger.error('Admin : No session');
        throw redirect(302, '/signin');
    }


    const jwtToken = cookies.get("token");
    if (!jwtToken) {
        logger.error('Admin : No token');
        throw redirect(302, '/signin');
    }

    let liveUsers: LiveUser[] = [];
    try {
        liveUsers = await getServerApi(jwtToken).getOnlineUsers();
        locals.liveUsers = liveUsers;
    } catch (error) {
        logger.error('Error fetching live users', error);
    }

    const url = new URL(request.url);

    if (url.pathname.startsWith('/admin')) {
        if (!user?.role?.includes("admin")) {
            logger.error("Unauthorized access attempt to admin route by:", user?.id);
            return redirect(302, "/");
        }
    }

    return { user, liveUsers: liveUsers, localGamesDir };

};
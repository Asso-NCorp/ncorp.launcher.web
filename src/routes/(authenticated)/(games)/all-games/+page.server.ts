import { db } from "$srv/db";

const GLOBAL_CACHE_TTL_MS = 5 * 60 * 1000;
let rolesCache: any = null;
let rolesCacheTime = 0;

export const load = async () => {
    const now = Date.now();

    if (!rolesCache || now - rolesCacheTime > GLOBAL_CACHE_TTL_MS) {
        rolesCache = await db.role.findMany();
        rolesCacheTime = now;
    }

    return {
        roles: rolesCache,
    };
};

import { db } from '$srv/db';
import type { LayoutServerLoad } from './$types';
import { logger } from '$src/lib/stores/loggerStore';
import type { global_settings } from '@prisma/client';

export const load: LayoutServerLoad = (async ({ locals }) => {

    const nicknames = await db.user.findMany({
        select: {
            name: true
        }
    })

    try {
        // Get global settings
        const globalSettings = await db.global_settings.findMany();
        locals.globalSettings = globalSettings;

    } catch (error) {
        logger.error(`Error fetching global settings: ${error}`);
    }

    return {
        nicknames: nicknames.map(({ name }) => name),
        globalSettings: locals.globalSettings as global_settings[]
    };
});
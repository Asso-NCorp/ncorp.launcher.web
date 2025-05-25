import { db } from '$srv/db';
import type { LayoutServerLoad } from './$types';
import { logger } from '$src/lib/stores/loggerStore';

export const load = (async ({ locals }) => {

    const nicknames = await db.user.findMany({
        select: {
            name: true
        }
    })

    try {
        // Get global settings
        const globalSettings = await db.global_settings.findMany();
        locals.globalSettings = globalSettings;
        logger.info('Global settings fetched successfully', { count: globalSettings.length });

    } catch (error) {
        logger.error('Error fetching global settings', error);
    }

    return {
        nicknames: nicknames.map(({ name }) => name),
        globalSettings: locals.globalSettings || []
    };
}) satisfies LayoutServerLoad;
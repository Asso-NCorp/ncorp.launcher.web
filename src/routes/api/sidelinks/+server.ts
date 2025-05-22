import { db } from '$srv/db';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
    try {
        // Check if the sidelink model exists in the Prisma client
        if (!db.sidelink) {
            console.warn('Sidelink model not found in Prisma client. This is expected if you have not run prisma generate after adding the model.');
            return json([]);
        }

        const sidelinks = await db.sidelink.findMany({
            orderBy: {
                name: 'asc'
            },
        });

        return json(sidelinks);
    } catch (error) {
        console.error('Error fetching sidelinks:', error);
        // Return an empty array instead of an error to prevent breaking the UI
        return json([]);
    }
};

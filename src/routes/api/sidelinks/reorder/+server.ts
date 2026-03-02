import { db } from '$srv/db';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * PATCH /api/sidelinks/reorder
 * Body: { orderedIds: number[] }
 * Sets position = index for each sidelink id in the array.
 */
export const PATCH: RequestHandler = async ({ request }) => {
    try {
        const { orderedIds } = (await request.json()) as { orderedIds: number[] };

        if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
            return json({ error: 'orderedIds array is required' }, { status: 400 });
        }

        // Update each sidelink's position in a transaction
        await db.$transaction(
            orderedIds.map((id, index) =>
                db.sidelink.update({
                    where: { id },
                    data: { position: index },
                })
            )
        );

        return json({ success: true });
    } catch (error) {
        console.error('Error reordering sidelinks:', error);
        return json({ error: 'Failed to reorder sidelinks' }, { status: 500 });
    }
};

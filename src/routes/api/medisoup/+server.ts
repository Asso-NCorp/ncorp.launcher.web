import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
    return json({
        status: 'ok',
        message: 'MediaSoup API is working'
    });
};

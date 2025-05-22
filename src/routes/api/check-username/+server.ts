import { auth } from '$src/lib/auth/server';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, request }) => {
    const username = url.searchParams.get('username');

    if (!username) {
        return json({ exists: false, error: 'No username provided' }, { status: 400 });
    }

    try {
        // Try to find a user with this username
        const users = await auth.api.listUsers({
            query: {
                limit: 1,
                searchField: 'name',
                searchValue: username,
                searchOperator: 'contains'
            },
            headers: request.headers
        });

        // Check if any user with this exact username exists
        const exists = users.users.some(user =>
            user.name?.toLowerCase() === username.toLowerCase()
        );

        return json({ exists });
    } catch (error) {
        console.error('Error checking username:', error);
        return json({ exists: false, error: 'Error checking username' }, { status: 500 });
    }
};

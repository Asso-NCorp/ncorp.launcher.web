import { db } from '$srv/db';
import type { PageServerLoad } from './$types';
import fs from 'fs';
import path from 'path';
import { dev } from '$app/environment'; // Import DEV environment variable

export const load: PageServerLoad = (async () => {
    let winnersImgDir: string;

    if (dev) {
        // Path in development mode
        winnersImgDir = path.join(process.cwd(), 'static', 'img', 'winners');
    } else {
        // Path in production mode
        // Assuming the server runs from the 'build' directory in production,
        // so 'client' is a subdirectory of CWD.
        winnersImgDir = path.join(process.cwd(), 'client', 'img', 'winners');
    }

    let winnerGifFiles: string[] = [];
    try {
        const files = fs.readdirSync(winnersImgDir);
        winnerGifFiles = files.filter((file) => file.toLowerCase().endsWith('.gif'));
    } catch (error) {
        console.error('Error reading winner GIFs directory:', error);
        // Optionally, handle the error e.g., by setting an empty array or a default
    }

    const userDisplayNames = await db.user.findMany({
        select: {
            id: true,
            name: true,
            role: true,
        },
        orderBy: {
            name: 'asc',
        },
    });

    return { userDisplayNames: userDisplayNames, winnerGifFiles };
}) satisfies PageServerLoad;
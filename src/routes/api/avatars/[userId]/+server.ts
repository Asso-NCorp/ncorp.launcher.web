import { PRIVATE_RESOURCES_PATH } from '$env/static/private';
import fsSync from 'fs';
import * as fs from 'node:fs/promises';
import path from 'path';

export async function GET({ params }) {
    const { userId } = params;
    const imagesPath = path.resolve(PRIVATE_RESOURCES_PATH);
    const avatarPath = path.join(imagesPath, "avatars", `${userId}.svg`);

    // Vérifie si le fichier existe
    if (fsSync.existsSync(avatarPath) === false) {
        /* // Redirect to the 404 image in static/img
        return redirect(302, "/img/not_found.webp"); */
        return new Response(null, { status: 404 });
    }

    const fileData = await fs.readFile(avatarPath);
    const fileStat = await fs.stat(avatarPath);
    const headers = {
        'Content-Type': 'image/svg+xml',
        'Content-Length': fileStat.size.toString(),
    };
    return new Response(fileData, { headers });
}
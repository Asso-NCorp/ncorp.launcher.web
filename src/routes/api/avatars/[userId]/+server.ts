import { PRIVATE_RESOURCES_PATH } from '$env/static/private';
import fsSync from 'fs';
import * as fs from 'node:fs/promises';
import path from 'path';

export async function GET({ params }) {
    const { userId } = params;
    const imagesPath = path.resolve(PRIVATE_RESOURCES_PATH);
    const avatarDir = path.join(imagesPath, "avatars");    // Look for any avatar file with this userId (any extension)
    const possibleExtensions = ['svg', 'png', 'jpg', 'jpeg', 'webp'];
    let avatarPath: string | null = null;
    let fileExtension: string | null = null;

    for (const ext of possibleExtensions) {
        const testPath = path.join(avatarDir, `${userId}.${ext}`);
        if (fsSync.existsSync(testPath)) {
            avatarPath = testPath;
            fileExtension = ext;
            break;
        }
    }

    // If no avatar file found
    if (!avatarPath || !fileExtension) {
        return new Response(null, { status: 404 });
    }

    const fileData = await fs.readFile(avatarPath);
    const fileStat = await fs.stat(avatarPath);    // Get the correct MIME type based on file extension
    const mimeTypes: Record<string, string> = {
        'svg': 'image/svg+xml',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'webp': 'image/webp'
    };

    const headers = {
        'Content-Type': mimeTypes[fileExtension] || 'application/octet-stream',
        'Content-Length': fileStat.size.toString(),
    };
    return new Response(fileData, { headers });
}
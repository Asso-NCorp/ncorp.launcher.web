import fs from 'fs';
import path from 'path';
import { dev } from '$app/environment';

export async function getWinnerGifFiles(): Promise<string[]> {
    let winnersImgDir: string;

    if (dev) {
        // Path in development mode
        winnersImgDir = path.join(process.cwd(), 'static', 'img', 'winners');
    } else {
        // Path in production mode
        winnersImgDir = path.join(process.cwd(), 'client', 'img', 'winners');
    }

    try {
        const files = fs.readdirSync(winnersImgDir);
        return files.filter((file) => file.toLowerCase().endsWith('.gif'));
    } catch (error) {
        console.error('Error reading winner GIFs directory:', error);
        return []; // Optionally, handle the error e.g., by returning an empty array or a default
    }
}

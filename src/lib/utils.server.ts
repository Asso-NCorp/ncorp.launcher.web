import { bigSmile, bottts, adventurer, avataaars, bigEars, micah, openPeeps, pixelArt, dylan } from "@dicebear/collection";
import * as fs from 'fs/promises';
import { createAvatar } from '@dicebear/core';
import { PRIVATE_RESOURCES_PATH } from '$env/static/private';
import path from 'path';

export const generateRandomAvatar = async (userId: string, overwrite: boolean = false) => {
    const imagesPath = path.resolve(PRIVATE_RESOURCES_PATH);
    const avatarPath = path.join(imagesPath, "avatars", `${userId}.svg`);
    const avatarsList = [bigSmile, bottts, adventurer, avataaars, bigEars, micah, openPeeps, pixelArt, dylan];
    const avatars = avatarsList[Math.floor(Math.random() * avatarsList.length)] as never;

    const randomColor = () => {
        let color;
        do {
            color = Math.floor(Math.random() * 16777215).toString(16);
        } while (isTooDark(color));
        return color;
    };

    const isTooDark = (color: string) => {
        const r = parseInt(color.slice(0, 2), 16);
        const g = parseInt(color.slice(2, 4), 16);
        const b = parseInt(color.slice(4, 6), 16);
        const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        return luminance < 0.5;
    };

    const backgroundColor = randomColor();
    const avatar = createAvatar(avatars, {
        size: 128,
        seed: userId,
        backgroundColor: [backgroundColor],
    }).toDataUri();

    const svgContent = avatar.replace(/^data:image\/svg\+xml;utf8,/, '');

    // Create the directory if it doesn't exist
    await fs.mkdir(path.dirname(avatarPath), { recursive: true });

    if (!overwrite) {
        try {
            await fs.access(avatarPath);
            return avatar;
        } catch (error) {
            // File doesn't exist, continue
        }
    }

    await fs.writeFile(avatarPath, decodeURIComponent(svgContent), 'utf8');

    return avatar;
}
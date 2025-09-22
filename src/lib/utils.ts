import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

import { PUBLIC_AGENT_URL, PUBLIC_BACKEND_API_URL } from "$env/static/public";
import { ServerApi } from "./api/server/apis/ServerApi";
import { LocalApi } from "./api/agent/apis/LocalApi";
import { Configuration as AgentConfig, MachineApi } from "./api/agent";
import { Configuration as ServerConfig } from "./api/server";
import type { InstallableGame } from "./shared-models";
import type { InstallableGameExtended } from "./types";
export function getLocalApi() {
    const config = new AgentConfig({
        basePath: PUBLIC_AGENT_URL,
        credentials: "include",
    });

    return new LocalApi(config);
}

export function syncArrayInPlace<T, K>(target: T[], source: T[], getKey: (x: T) => K) {
    const srcOrder = new Map<K, number>();
    const srcByKey = new Map<K, T>();
    for (let i = 0; i < source.length; i++) {
        const k = getKey(source[i]);
        srcOrder.set(k, i);
        srcByKey.set(k, source[i]);
    }

    // Suppr en place (ceux absents de source)
    for (let i = target.length - 1; i >= 0; i--) {
        const k = getKey(target[i]);
        if (!srcByKey.has(k)) target.splice(i, 1);
    }

    // Maj/Ajout en place
    const tgtByKey = new Map<K, T>(target.map((t) => [getKey(t), t]));
    for (const s of source) {
        const k = getKey(s);
        const existing = tgtByKey.get(k);
        if (existing) {
            Object.assign(existing, s); // mise à jour des champs
        } else {
            target.push(s); // ajout
        }
    }

    // Réordonner comme le serveur (in-place)
    target.sort((a, b) => {
        const ia = srcOrder.get(getKey(a)) ?? Number.MAX_SAFE_INTEGER;
        const ib = srcOrder.get(getKey(b)) ?? Number.MAX_SAFE_INTEGER;
        return ia - ib;
    });
}

export function getMachineApi() {
    const config = new AgentConfig({
        basePath: PUBLIC_AGENT_URL,
        credentials: "include",
    });

    return new MachineApi(config);
}

export function getServerApi(token?: string) {
    const serverConfig = new ServerConfig({
        basePath: PUBLIC_BACKEND_API_URL,
        credentials: "include",
        accessToken: token,
    });
    return serverConfig ? new ServerApi(serverConfig) : new ServerApi();
}

/**
 * Combines available games with installed games, removing duplicates and prioritizing installed games
 * @param games available games
 * @param installedGames locally installed games
 * @returns list of games with duplicates removed and installed games prioritized
 */
export const getCombinedGameList = async (games: InstallableGame[], installedGames: InstallableGame[]) => {
    // Combine both lists
    const allGames = [...games, ...installedGames];

    // Remove duplicates and prioritize `isInstalled: true`
    const uniqueGames = Object.values(
        allGames.reduce<Record<string, InstallableGame>>((acc, game) => {
            const lowerSlug = game.folderSlug!.toLowerCase();
            if (!acc[lowerSlug] || game.isInstalled) {
                acc[lowerSlug] = game;
            }
            return acc;
        }, {}),
    );

    // Sort by `isInstalled` and then by `name`
    uniqueGames.sort((a, b) => {
        if (a.isInstalled && !b.isInstalled) return -1;
        if (!a.isInstalled && b.isInstalled) return 1;
        return a.folderSlug!.localeCompare(b.folderSlug!);
    });

    return uniqueGames;
};

/**
 * Converts a URL to a Base64 representation
 * @param url URL of the image to convert to Base64
 * @returns Base64 representation of the image
 */
export async function urlToBase64(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const blob = await response.blob();
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                resolve(result.split(",")[1]); // Exclut le préfixe "data:image/*;base64,"
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        throw new Error(`Failed to convert URL to Base64: ${error}`);
    }
}

export const getGameResourceUrl = (game: InstallableGame, resource: string) => {
    const url = `${PUBLIC_BACKEND_API_URL}/resources/${resource}`;
    return url;
};

export const getRandomScreenshot = (game: InstallableGame): string | undefined => {
    if (!game.screenshots || game.screenshots.length === 0) return undefined;
    const randomIndex = Math.floor(Math.random() * game.screenshots.length);
    return game.screenshots[randomIndex];
};

export function isRecentlyAdded(game: InstallableGame | InstallableGameExtended) {
    if (!game?.dateAdded) return false;

    let addedTs: number;
    if (typeof game.dateAdded === "number") {
        addedTs = game.dateAdded;
    } else {
        // Normalize common sentinel like "0001-01-01..." or "01/01/0001"
        const raw = String(game.dateAdded).trim();
        if (/^0{0,2}1[-/ ]0{0,2}1[-/ ]0{2,4}01/i.test(raw) || raw.startsWith("0001-01-01")) {
            return false;
        }
        addedTs = Date.parse(raw);
    }

    if (isNaN(addedTs)) return false;

    const addedDate = new Date(addedTs);
    // Ignore obviously invalid / sentinel years
    if (addedDate.getFullYear() < 2000) return false;

    const now = Date.now();
    if (addedTs > now) return false; // future => invalid

    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    return now - addedTs <= THIRTY_DAYS;
}

import { PRIVATE_RESOURCES_PATH } from "$env/static/private";
import fs from "fs";
import path from "path";
import { redirect, error } from "@sveltejs/kit";

export async function GET(event) {
    // Extract params (will be empty for this static route) and fallback to query string
    const { params, url } = event;
    let { animated, filename } = params as { animated?: string; filename?: string };
    if (!filename) filename = url.searchParams.get("filename") || undefined;
    if (!animated) animated = url.searchParams.get("animated") || undefined;

    // Validate filename
    if (!filename || !/^[a-zA-Z0-9._-]+$/.test(filename)) {
        return redirect(302, "/img/no_decoration.png");
    }

    const baseDir = path.resolve(PRIVATE_RESOURCES_PATH, "nametemplates");
    const staticFilePath = path.join(baseDir, `${filename}.png`);
    const animatedFlag = animated === "true";
    const animatedFilePath = path.join(baseDir, `${filename}.webm`);

    try {
        if (animatedFlag && fs.existsSync(animatedFilePath)) {
            const buf = await fs.promises.readFile(animatedFilePath);
            return new Response(new Uint8Array(buf), {
                headers: { "Content-Type": "video/webm" },
            });
        }
        if (fs.existsSync(staticFilePath)) {
            const buf = await fs.promises.readFile(staticFilePath);
            return new Response(new Uint8Array(buf), {
                headers: { "Content-Type": "image/png" },
            });
        }
        return redirect(302, "/img/no_decoration.png");
    } catch (e) {
        console.error("Decoration fetch error:", e);
        throw error(500, "Failed to load decoration");
    }
}

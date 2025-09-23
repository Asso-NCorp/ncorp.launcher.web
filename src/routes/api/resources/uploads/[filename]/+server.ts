import { PRIVATE_RESOURCES_PATH } from "$env/static/private";
import fs from "fs";
import path from "path";
import { redirect } from "@sveltejs/kit";

function contentTypeFor(file: string) {
    const ext = path.extname(file).toLowerCase();
    switch (ext) {
        case ".png":
            return "image/png";
        case ".webp":
            return "image/webp";
        case ".gif":
            return "image/gif";
        case ".jpg":
        case ".jpeg":
            return "image/jpeg";
        default:
            return "application/octet-stream";
    }
}

export async function GET({ params }) {
    const { filename } = params;
    const uploadsPath = path.resolve(PRIVATE_RESOURCES_PATH, "uploads");
    const filePath = path.join(uploadsPath, filename);

    if (fs.existsSync(filePath)) {
        return new Response(fs.readFileSync(filePath), {
            headers: { "Content-Type": contentTypeFor(filePath) },
        });
    }

    return redirect(302, "/img/not_found.webp");
}

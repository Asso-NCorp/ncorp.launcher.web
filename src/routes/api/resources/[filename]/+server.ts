import { PRIVATE_RESOURCES_PATH } from "$env/static/private";
import fs from "fs";
import path from "path";
import { redirect } from "@sveltejs/kit";
import { getServerApi } from "$src/lib/utils.js";

export async function GET({ params }) {
    const { filename } = params;
    const imagesPath = path.resolve(PRIVATE_RESOURCES_PATH);
    const filePath = path.join(imagesPath, filename);

    // Vérifie si le fichier existe
    if (fs.existsSync(filePath)) {
        return new Response(fs.readFileSync(filePath), {
            headers: {
                "Content-Type": "image/jpeg",
            },
        });
    } else {
        if (["cover_", "screenshot_"].includes(filename) === false) {
            try {
                await getServerApi().downloadImage({ igdbImage: filename });
            } catch {}
            if (fs.existsSync(filePath)) {
                return new Response(fs.readFileSync(filePath), {
                    headers: {
                        "Content-Type": "image/jpeg",
                    },
                });
            }
        }
        // Redirect to the 404 image in static/img
        return redirect(302, "/img/not_found.webp");
    }
}

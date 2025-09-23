import { PRIVATE_RESOURCES_PATH } from "$env/static/private";
import fs from "fs";
import path from "path";

// POST /api/resources/uploads
// Accepts multipart/form-data with a single field `file` (or `image`).
// Saves into `${PRIVATE_RESOURCES_PATH}/uploads` and returns { url: "/api/resources/uploads/<filename>" }.
export async function POST({ request, url }) {
    try {
        const formData = await request.formData();
        const file = (formData.get("file") || formData.get("image")) as File | null;
        if (!file || typeof (file as any).arrayBuffer !== "function") {
            return new Response(JSON.stringify({ error: "No file provided" }), { status: 400 });
        }

        const uploadsDir = path.join(PRIVATE_RESOURCES_PATH, "uploads");
        fs.mkdirSync(uploadsDir, { recursive: true });

        // Determine filename & extension
        const originalName = (file as File).name || "upload";
        const extFromName = path.extname(originalName).toLowerCase();
        const type = (file as File).type || "";
        const extFromType =
            type === "image/png"
                ? ".png"
                : type === "image/webp"
                  ? ".webp"
                  : type === "image/gif"
                    ? ".gif"
                    : type === "image/jpeg" || type === "image/jpg"
                      ? ".jpg"
                      : extFromName || ".bin";

        const safeBase =
            path
                .basename(originalName, extFromName || extFromType)
                .replace(/[^a-zA-Z0-9-_]+/g, "-")
                .replace(/^-+|-+$/g, "")
                .slice(0, 64) || "upload";
        const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const finalName = `${safeBase}-${unique}${extFromType}`;

        const filePath = path.join(uploadsDir, finalName);
        const buf = Buffer.from(await (file as File).arrayBuffer());
        fs.writeFileSync(filePath, buf);

        const publicUrlPath = `/api/resources/uploads/${encodeURIComponent(finalName)}`;
        // Return a path URL (client can resolve relative to current origin)
        return new Response(JSON.stringify({ url: publicUrlPath }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("Upload error:", err);
        return new Response(JSON.stringify({ error: "Upload failed" }), { status: 500 });
    }
}

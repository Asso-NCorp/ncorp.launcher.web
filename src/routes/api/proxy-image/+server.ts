import type { RequestHandler } from "@sveltejs/kit";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const DEFAULT_MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB default (was 8MB)
const MAX_OVERRIDE_BYTES = 50 * 1024 * 1024; // Absolute cap at 50MB

export const GET: RequestHandler = async ({ url }) => {
    try {
        const target = url.searchParams.get("url");
        if (!target) return jsonError("Missing url parameter", 400);

        let parsed: URL;
        try {
            parsed = new URL(target);
        } catch {
            return jsonError("Invalid URL", 400);
        }

        if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
            return jsonError("Protocol not allowed", 400);
        }

        // Prevent recursion
        if (
            parsed.host === url.host &&
            (parsed.pathname.startsWith("/api/proxy-image") || parsed.pathname.startsWith("/api/proxy-image/"))
        ) {
            return jsonError("Recursive proxy blocked", 400);
        }

        // Determine per-request limit
        const maxBytesParam = url.searchParams.get("maxBytes");
        let maxSize = DEFAULT_MAX_SIZE_BYTES;
        if (maxBytesParam) {
            const parsedMax = parseInt(maxBytesParam, 10);
            if (!Number.isNaN(parsedMax) && parsedMax > 0) {
                maxSize = Math.min(parsedMax, MAX_OVERRIDE_BYTES);
            }
        }

        const fallbackRequested = url.searchParams.get("fallback") === "1";

        const upstream = await fetch(parsed.toString(), {
            headers: {
                "User-Agent": "KeyTrapLauncher/1.0 (+image-proxy)",
                Accept: "image/avif,image/webp,image/apng,image/*;q=0.8,*/*;q=0.5",
                Referer: parsed.origin,
            },
            redirect: "follow",
        });

        if (!upstream.ok) {
            return jsonError(`Upstream HTTP ${upstream.status}`, 502);
        }

        const contentType = upstream.headers.get("Content-Type") || "";
        if (!contentType.toLowerCase().startsWith("image/")) {
            return jsonError("Resource is not an image", 415);
        }

        // Early size check via Content-Length if present
        const contentLengthHeader = upstream.headers.get("Content-Length");
        if (contentLengthHeader) {
            const contentLength = parseInt(contentLengthHeader, 10);
            if (!Number.isNaN(contentLength) && contentLength > maxSize) {
                return sizeExceededResponse(contentLength, maxSize, fallbackRequested, target);
            }
        }

        const reader = upstream.body?.getReader();
        if (!reader) {
            return jsonError("No readable stream", 502);
        }

        const chunks: Uint8Array[] = [];
        let total = 0;
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
                total += value.length;
                if (total > maxSize) {
                    return sizeExceededResponse(total, maxSize, fallbackRequested, target);
                }
                chunks.push(value);
            }
        }

        const buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));
        const base64 = buffer.toString("base64");
        const dataUrl = `data:${contentType};base64,${base64}`;

        return new Response(JSON.stringify({ base64: dataUrl, mime: contentType, size: total }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch (e: any) {
        return jsonError(e?.message || "Proxy error", 500);
    }
};

function jsonError(message: string, status: number) {
    return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

function sizeExceededResponse(actual: number, limit: number, fallback: boolean, url: string) {
    if (fallback) {
        return new Response(
            JSON.stringify({
                error: "Image too large",
                size: actual,
                limit,
                fallback: true,
                url,
            }),
            {
                status: 413,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
    return jsonError(`Image too large (size=${actual} > limit=${limit})`, 413);
}

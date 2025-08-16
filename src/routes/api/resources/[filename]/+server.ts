// src/routes/api/resource/[...filename]/+server.ts
import { PRIVATE_RESOURCES_PATH } from "$env/static/private";
import { error, type RequestHandler } from "@sveltejs/kit";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import sharp from "sharp";

// ---- Tuning Sharp (évite le CPU à 100%)
sharp.concurrency(Math.max(1, Math.min(2, os.cpus().length - 1)));
sharp.cache({ files: 256, items: 512, memory: 256 * 1024 * 1024 });

// ---- Dossiers
const ORIGIN_ROOT = path.resolve(PRIVATE_RESOURCES_PATH);
const VARIANTS_ROOT = path.resolve(".cache/images"); // persistant (monte-le sur SSD)
await fsp.mkdir(VARIANTS_ROOT, { recursive: true }).catch(() => {});

// ---- In-flight map pour éviter N rendus du même fichier
const inflight = new Map<string, Promise<string>>(); // key -> variantPath

const MIME: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    avif: "image/avif",
};

function safeJoin(root: string, rel: string) {
    const p = path.resolve(root, rel.replaceAll("\\", "/"));
    if (!p.startsWith(path.resolve(root) + path.sep)) throw error(400, "Invalid path");
    return p;
}

function chooseFormat(url: URL, accept: string | null, fallbackExt: string): "avif" | "webp" | "jpeg" | "png" {
    const f = (url.searchParams.get("f") ?? "").toLowerCase();
    if (f === "avif" || f === "webp" || f === "jpeg" || f === "png") return f as any;
    if (accept?.includes("image/avif")) return "avif";
    if (accept?.includes("image/webp")) return "webp";
    return fallbackExt === "png" ? "png" : "jpeg";
}

function variantKey(absFilePath: string, w?: number, q?: number, fmt?: string, mtimeMs?: number) {
    const base = `${absFilePath}|${mtimeMs}|w=${w ?? ""}|q=${q ?? ""}|f=${fmt ?? ""}`;
    return crypto.createHash("sha1").update(base).digest("hex"); // stable & court
}

function variantPathFor(absFilePath: string, key: string, outFmt: string) {
    // structure: .cache/images/<sha1 of original dir>/basename-key.fmt
    const dirHash = crypto.createHash("sha1").update(path.dirname(absFilePath)).digest("hex").slice(0, 8);
    const base = path.basename(absFilePath, path.extname(absFilePath));
    const folder = path.join(VARIANTS_ROOT, dirHash, base);
    return path.join(folder, `${base}-${key}.${outFmt}`);
}

async function ensureDir(p: string) {
    await fsp.mkdir(path.dirname(p), { recursive: true });
}

function makeETag(stat: fs.Stats, key: string) {
    const hash = crypto.createHash("sha1").update(`${stat.size}-${stat.mtimeMs}-${key}`).digest("hex").slice(0, 16);
    return `W/"${stat.size}-${hash}"`;
}

async function buildVariant(
    absFilePath: string,
    outPath: string,
    w: number | undefined,
    q: number,
    fmt: "avif" | "webp" | "jpeg" | "png",
) {
    await ensureDir(outPath);
    const tmp = `${outPath}.tmp-${process.pid}-${Date.now()}`;
    let pipe = sharp(absFilePath, { failOn: "none" });
    if (w) pipe = pipe.resize({ width: w, withoutEnlargement: true });

    switch (fmt) {
        case "avif":
            pipe = pipe.avif({ quality: q });
            break;
        case "webp":
            pipe = pipe.webp({ quality: q });
            break;
        case "png":
            pipe = pipe.png({ compressionLevel: 9 });
            break;
        default:
            pipe = pipe.jpeg({ quality: q, mozjpeg: true });
            break;
    }
    await pipe.toFile(tmp);
    await fsp.rename(tmp, outPath); // atomic
    return outPath;
}

export const GET: RequestHandler = async (event) => handle(event, false);
export const HEAD: RequestHandler = async (event) => handle(event, true);

async function handle(event: Parameters<RequestHandler>[0], headOnly: boolean) {
    const { params, url, request, setHeaders } = event;
    const filenameParam = Array.isArray(params.filename) ? params.filename.join("/") : (params.filename as string);
    if (!filenameParam) throw error(400, "Missing filename");

    const abs = safeJoin(ORIGIN_ROOT, filenameParam);
    if (!fs.existsSync(abs)) throw error(404, "Not found");

    const stat = await fsp.stat(abs);
    const ext = path.extname(abs).slice(1).toLowerCase();
    const accept = request.headers.get("accept");

    const w = Number(url.searchParams.get("w") ?? 0) || undefined;
    const qRaw = Number(url.searchParams.get("q") ?? 0) || undefined;
    if (w && (w < 16 || w > 4096)) throw error(400, "Invalid width");
    const outFmt = chooseFormat(url, accept, ext);
    const q = qRaw && (qRaw < 20 || qRaw > 95) ? 75 : (qRaw ?? (outFmt === "jpeg" ? 78 : 70));

    // Si pas de transform ET format original acceptable -> stream de l’original (zéro CPU)
    const noTransform =
        !w &&
        !qRaw &&
        ((outFmt === "png" && ext === "png") || (outFmt === "jpeg" && (ext === "jpg" || ext === "jpeg")));
    if (noTransform) {
        const etag = makeETag(stat, "orig");
        if (request.headers.get("if-none-match") === etag) {
            setHeaders({ "Cache-Control": "public, max-age=31536000, immutable", ETag: etag, Vary: "Accept" });
            return new Response(null, { status: 304 });
        }
        setHeaders({
            "Content-Type": MIME[ext] ?? "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, immutable",
            ETag: etag,
            Vary: "Accept",
        });
        return headOnly ? new Response(null, { status: 200 }) : new Response(fs.createReadStream(abs) as any);
    }

    // Transform demandée -> cherche d’abord la variante disque
    const key = variantKey(abs, w, q, outFmt, stat.mtimeMs);
    const vPath = variantPathFor(abs, key, outFmt);

    try {
        const vStat = await fsp.stat(vPath);
        const etag = makeETag(vStat, key);
        if (request.headers.get("if-none-match") === etag) {
            setHeaders({
                "Cache-Control": "public, max-age=31536000, immutable",
                ETag: etag,
                "Content-Type": mimeOf(outFmt),
                Vary: "Accept",
            });
            return new Response(null, { status: 304 });
        }
        setHeaders({
            "Cache-Control": "public, max-age=31536000, immutable",
            ETag: etag,
            "Content-Type": mimeOf(outFmt),
            Vary: "Accept",
        });
        return headOnly ? new Response(null, { status: 200 }) : new Response(fs.createReadStream(vPath) as any);
    } catch {
        // pas en cache -> rendre une seule fois (dé-dup)
    }

    const inflightKey = vPath;
    if (!inflight.has(inflightKey)) {
        inflight.set(
            inflightKey,
            buildVariant(abs, vPath, w, q, outFmt).finally(() => {
                // Laisser le chemin existant; la prochaine requête lira depuis disque
                inflight.delete(inflightKey);
            }),
        );
    }
    // Attendre le rendu en cours
    await inflight.get(inflightKey)!;

    // Puis servir depuis disque
    const vStat2 = await fsp.stat(vPath);
    const etag2 = makeETag(vStat2, key);
    setHeaders({
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: etag2,
        "Content-Type": mimeOf(outFmt),
        Vary: "Accept",
    });
    return headOnly ? new Response(null, { status: 200 }) : new Response(fs.createReadStream(vPath) as any);
}

function mimeOf(fmt: string) {
    return fmt === "avif" ? "image/avif" : fmt === "webp" ? "image/webp" : fmt === "png" ? "image/png" : "image/jpeg";
}

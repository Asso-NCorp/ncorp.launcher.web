/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

import { build, files, prerendered, version } from "$service-worker";
declare let self: ServiceWorkerGlobalScope;

// ---- Config ----
const CACHE = `cache-${version}`;
const ASSETS = new Set<string>([...build, ...files, ...prerendered]);

// back ressources (LAN/offline)
const RESOURCE_HOSTS = new Set(["server.n-lan.com"]);
const RESOURCES_PREFIX = "/resources/";
const LEGACY_API_PREFIX = "/api/Server/Resource";

// ---- Helpers ----
const toURL = (path: string) => new URL(path, self.location.origin).toString();
const isSameOrigin = (u: URL) => u.origin === self.location.origin;
const isAssetPath = (u: URL) => ASSETS.has(u.pathname) || ASSETS.has(toURL(u.pathname));

const isHTMLRequest = (req: Request) =>
    req.mode === "navigate" || (req.headers.get("accept") ?? "").includes("text/html");

const isHTMLResponse = (res: Response) => (res.headers.get("content-type") ?? "").includes("text/html");

const isCacheableResponse = (res: Response) => {
    if (!res || !res.ok) return false;
    if (isHTMLResponse(res)) return false; // never cache HTML
    const ccRaw = res.headers.get("Cache-Control") ?? "";
    const cc = ccRaw.toLowerCase();

    // Previously only filtered no-store & private.
    // Add no-cache & max-age=0 so we do not persist responses that require revalidation.
    if (/\b(no-store|private|no-cache)\b/.test(cc)) return false;
    if (/\bmax-age=0\b/.test(cc)) return false;

    // NOTE: Other directives (e.g. max-age>0, must-revalidate, stale-while-revalidate)
    // are not enforced here; cached entries live until SW version changes or are manually refreshed.
    return true;
};

// ---- Install: precache assets (dont prerendered) ----
self.addEventListener("install", (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE);
            await cache.addAll([...ASSETS].map(toURL));
            await self.skipWaiting();
        })(),
    );
});

// ---- Activate: cleanup old caches ----
self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => (k !== CACHE ? caches.delete(k) : undefined)));
            await self.clients.claim();
        })(),
    );
});

// ---- Fetch strategies ----
self.addEventListener("fetch", (event: FetchEvent) => {
    const { request } = event;
    if (request.method !== "GET") return;

    const url = new URL(request.url);
    const sameOrigin = isSameOrigin(url);
    const resourceHost =
        RESOURCE_HOSTS.has(url.hostname) &&
        (url.pathname.startsWith(RESOURCES_PREFIX) || url.pathname.startsWith(LEGACY_API_PREFIX));

    event.respondWith(
        (async () => {
            const cache = await caches.open(CACHE);

            // 1) Assets (build/files/prerendered): cache-first
            if (isAssetPath(url)) {
                const hit = (await cache.match(request)) || (await cache.match(toURL(url.pathname)));
                if (hit) return hit;
                const res = await fetch(request);
                if (sameOrigin && isCacheableResponse(res)) {
                    await cache.put(toURL(url.pathname), res.clone());
                }
                return res;
            }

            // 2) Requêtes HTML (navigations/pages SSR) : **jamais** en cache
            if (isHTMLRequest(request)) {
                try {
                    // network-only
                    return await fetch(request);
                } catch {
                    // offline: si une page prerendered existe en cache, on la renvoie, sinon 503
                    const fallback = await cache.match(toURL(url.pathname));
                    return fallback ?? new Response("Offline", { status: 503 });
                }
            }

            // 3) Ressources backend (images/docs) depuis server.n-lan.com : cache-first + revalidate
            if (resourceHost) {
                const cached = await cache.match(request);

                // Revalidation arrière-plan
                event.waitUntil(
                    (async () => {
                        try {
                            const fresh = await fetch(request);
                            if (isCacheableResponse(fresh)) await cache.put(request, fresh.clone());
                        } catch {
                            /* offline */
                        }
                    })(),
                );

                if (cached) return cached;

                try {
                    const res = await fetch(request);
                    if (isCacheableResponse(res)) await cache.put(request, res.clone());
                    return res;
                } catch {
                    return new Response("Offline", { status: 503 });
                }
            }

            // 4) Tout le reste (JSON, APIs, images same-origin, etc.) : network-first, cache si cacheable (non-HTML)
            try {
                const res = await fetch(request);
                if (sameOrigin && isCacheableResponse(res)) await cache.put(request, res.clone());
                return res;
            } catch {
                // fallback cache (mais comme on n'y met pas de HTML, pas de pollution)
                return (
                    (await cache.match(request)) ||
                    (await cache.match(toURL(url.pathname))) ||
                    new Response("Not found", { status: 404 })
                );
            }
        })(),
    );
});

// ---- Messages ----
self.addEventListener("message", (event) => {
    if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

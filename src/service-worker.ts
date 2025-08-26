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

// helpers
const toURL = (path: string) => new URL(path, self.location.origin).toString();
const isSameOrigin = (u: URL) => u.origin === self.location.origin;
const isCacheable = (res: Response) => {
    if (!res) return false;
    if (res.type === "opaque") return true; // ex. cross-origin sans CORS
    if (!res.ok) return false;
    const cc = res.headers.get("Cache-Control") ?? "";
    return !/\bno-store\b/i.test(cc) && !/\bprivate\b/i.test(cc);
};

// ---- Install: precache assets ----
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
    const absolutePath = toURL(url.pathname);
    const isAsset = ASSETS.has(url.pathname) || ASSETS.has(absolutePath);
    const isResourceHost = RESOURCE_HOSTS.has(url.hostname);
    const isResourcePath =
        (isResourceHost && url.pathname.startsWith(RESOURCES_PREFIX)) ||
        (isResourceHost && url.pathname.startsWith(LEGACY_API_PREFIX));

    event.respondWith(
        (async () => {
            const cache = await caches.open(CACHE);

            // 1) SvelteKit assets: cache-first
            if (isAsset) {
                const hit = (await cache.match(request)) || (await cache.match(absolutePath));
                if (hit) return hit;

                const res = await fetch(request);
                if (isSameOrigin(url) && isCacheable(res)) {
                    cache.put(absolutePath, res.clone());
                }
                return res;
            }

            // 2) Back resources (images/doc) depuis server.n-lan.com:
            //    cache-first + revalidate (offline-friendly)
            if (isResourcePath) {
                const cached = await cache.match(request);

                // revalidation en arrière-plan
                event.waitUntil(
                    (async () => {
                        try {
                            const fresh = await fetch(request);
                            if (isCacheable(fresh)) {
                                await cache.put(request, fresh.clone());
                            }
                        } catch {
                            /* offline => on garde le cache existant */
                        }
                    })(),
                );

                if (cached) return cached;

                try {
                    const res = await fetch(request);
                    if (isCacheable(res)) await cache.put(request, res.clone());
                    return res;
                } catch {
                    return new Response("Offline", { status: 503 });
                }
            }

            // 3) Tout le reste: network-first, fallback cache
            try {
                const res = await fetch(request);
                // on ne met en cache que le même-origin "sûr"
                if (isSameOrigin(url) && isCacheable(res)) {
                    cache.put(request, res.clone());
                }
                return res;
            } catch {
                return (
                    (await cache.match(request)) ||
                    (await cache.match(absolutePath)) ||
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

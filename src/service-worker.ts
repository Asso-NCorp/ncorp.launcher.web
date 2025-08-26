/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

import { build, files, prerendered, version } from "$service-worker";

declare let self: ServiceWorkerGlobalScope;

const CACHE = `cache-${version}`;
const ASSETS = new Set<string>([...build, ...files, ...prerendered]);

const toURL = (path: string) => new URL(path, self.location.origin).toString();

self.addEventListener("install", (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE);
            await cache.addAll([...ASSETS].map(toURL));
            // activate new SW asap
            await self.skipWaiting();
        })(),
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => (k !== CACHE ? caches.delete(k) : undefined)));
            await self.clients.claim();
        })(),
    );
});

self.addEventListener("fetch", (event: FetchEvent) => {
    if (event.request.method !== "GET") return;

    const reqUrl = new URL(event.request.url);
    const absolutePath = toURL(reqUrl.pathname);

    const isAsset = ASSETS.has(reqUrl.pathname) || ASSETS.has(absolutePath);

    event.respondWith(
        (async () => {
            const cache = await caches.open(CACHE);

            // Cache-first pour les assets connus
            if (isAsset) {
                const hit = (await cache.match(event.request)) || (await cache.match(absolutePath));
                if (hit) return hit;

                const res = await fetch(event.request);
                if (res.ok && reqUrl.origin === self.location.origin) {
                    cache.put(absolutePath, res.clone());
                }
                return res;
            }

            // Network-first pour le reste, fallback cache
            try {
                const res = await fetch(event.request);
                if (res.ok && reqUrl.origin === self.location.origin) {
                    cache.put(event.request, res.clone());
                }
                return res;
            } catch {
                return (
                    (await cache.match(event.request)) ||
                    (await cache.match(absolutePath)) ||
                    new Response("Not found", { status: 404 })
                );
            }
        })(),
    );
});

self.addEventListener("message", (event) => {
    if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

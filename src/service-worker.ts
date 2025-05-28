/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

import { build, files, version } from "$service-worker"
const CACHE = `cache-${version}`;
const ASSETS = [...build, ...files];

declare let self: ServiceWorkerGlobalScope;

console.log("Service Worker: Initializing...");
console.log("Service Worker: Version:", version);

// install service worker
self.addEventListener("install", event => {
    async function addFilesToCache() {
        const cache = await caches.open(CACHE);
        await cache.addAll(ASSETS);
        console.log("Service Worker: Files added to cache:", ASSETS.length);
    }
    event.waitUntil(addFilesToCache());
});


// activate service worker
self.addEventListener("activate", event => {
    async function clearOldCaches() {
        const keys = await caches.keys();
        await Promise.all(
            keys.map(key => {
                if (key !== CACHE) {
                    console.log("Service Worker: Deleting old cache:", key);
                    return caches.delete(key);
                }
            })
        );
    }
    event.waitUntil(clearOldCaches());
});

// listen for fetch events
self.addEventListener("fetch", async event => {
    if (event.request.method !== "GET") return;

    async function respond() {

        const url = new URL(event.request.url);
        const cache = await caches.open(CACHE);

        // Check if the request is for a file in the cache
        if (ASSETS.includes(url.pathname) || ASSETS.includes(url.href)) {
            console.log("Service Worker: Serving from cache:", url.pathname);
            const cachedResponse = await cache.match(url.pathname);
            if (cachedResponse) {
                return cachedResponse;
            }
        }

        // Try the network first, then fall back to the cache
        try {
            const response = await fetch(event.request);

            const isNotExtension = url.protocol === "http:" || url.protocol === "https:";
            const isSuccess = response && response.status === 200;

            if (isNotExtension && isSuccess) {
                cache.put(event.request, response.clone());
            }

            return response;
        } catch {
            const cachedResponse = await cache.match(url.pathname);
            if (cachedResponse) {
                console.log("Service Worker: Serving from cache (fallback):", url.pathname);
                return cachedResponse;
            }
        }

        return new Response("Not found", { status: 404 });
    }

    event.respondWith(respond());
});

self.addEventListener("message", event => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        console.log("Service Worker: Skipping waiting and activating new service worker");
        self.skipWaiting();
    }
});

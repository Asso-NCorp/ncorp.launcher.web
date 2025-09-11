import { browser, dev } from "$app/environment";
import type { ClientInit } from "@sveltejs/kit";

if (browser && !dev && "serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
    caches?.keys?.().then((keys) => keys.forEach((k) => caches.delete(k)));
}

if (browser && !dev && "serviceWorker" in navigator) {
    console.log("Registering service worker");
    navigator.serviceWorker.register("/service-worker.js", { type: "module" });
}

export const init: ClientInit = () => {
    if (browser) {
        if ((window as any).__hideBoot) {
            (window as any).__hideBoot();
            delete (window as any).__hideBoot;
        }
    }
    return;
};
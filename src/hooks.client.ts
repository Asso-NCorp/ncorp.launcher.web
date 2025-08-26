import { browser, dev } from "$app/environment";

if (browser && dev && "serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
    caches?.keys?.().then((keys) => keys.forEach((k) => caches.delete(k)));
}

if (browser && !dev && "serviceWorker" in navigator) {
    console.log("Registering service worker (prod only)");
    navigator.serviceWorker.register("/service-worker.js", { type: "module" });
}

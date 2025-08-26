import { browser } from "$app/environment";

if (browser && import.meta.env.PROD && "serviceWorker" in navigator) {
    console.log("Registering service worker");
    navigator.serviceWorker.register("/service-worker.js", { type: "module" });
}

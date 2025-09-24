import { browser, dev } from "$app/environment";
import type { ClientInit } from "@sveltejs/kit";
import { logger } from "better-auth";

if (browser && !dev && "serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then(async (registrations) => {
        for (const r of registrations) await r.unregister();

        for (const k of await caches.keys()) await caches.delete(k);

        //navigator.serviceWorker.register("/service-worker.js", { type: "module" });
    });
}

export const init: ClientInit = async () => {
    // Fonction utilitaire pour attendre toutes les images
    async function waitForImages() {
        const images = Array.from(document.images);

        await Promise.all(
            images.map((img) => {
                if (img.complete) {
                    // déjà chargée + décodée
                    return img.decode().catch(() => null);
                }
                return new Promise<void>((resolve) => {
                    img.addEventListener("load", () => {
                        img.decode()
                            .catch(() => null)
                            .finally(() => resolve());
                    });
                    img.addEventListener("error", () => resolve()); // ignorer erreurs
                });
            }),
        );
    }

    // Attendre que le DOM + images soient ok
    if (document.readyState === "complete") {
        await waitForImages();
        window.__hideBoot?.();
    } else {
        window.addEventListener(
            "load",
            async () => {
                await waitForImages();
                window.__hideBoot?.();
            },
            { once: true },
        );
    }
};

import type { PageServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ url }) => {
    const u = url.searchParams.get("u") ?? "";

    // Décodage sûr (support un éventuel double-encodage)
    let raw = u;
    try {
        raw = decodeURIComponent(raw);
    } catch {}
    try {
        raw = decodeURIComponent(raw);
    } catch {}

    // On attend "web+launcher://<path>[?query][#hash]"
    const PREFIX = "web+launcher://";
    if (raw.startsWith(PREFIX)) raw = raw.slice(PREFIX.length);

    // Séparer path ?query #hash
    // (on accepte éventuellement un slash initial manquant)
    raw = raw.replace(/^\/+/, "");
    const hashSplit = raw.split("#");
    const beforeHash = hashSplit[0] ?? "";
    const hash = hashSplit[1] ? `#${hashSplit.slice(1).join("#")}` : "";

    const querySplit = beforeHash.split("?");
    const pathPart = querySplit[0] ?? "";
    const query = querySplit[1] ? `?${querySplit.slice(1).join("?")}` : "";

    // Construire la cible locale
    const target = "/" + pathPart + query + hash;

    // Sécurité minimale: empêche sortie du scope
    if (!target.startsWith("/")) throw redirect(302, "/");

    throw redirect(302, target);
};

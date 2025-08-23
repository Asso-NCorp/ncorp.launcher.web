<script lang="ts">
    import { X, Upload, Image, CircleAlert } from "@lucide/svelte";
    import { t } from "$src/lib/translations";
    import * as Card from "$lib/components/ui/card";
    import * as Tabs from "$lib/components/ui/tabs";

    const {
        logo = undefined,
        logos = [], // CHANGED: logos now string[] of URLs
        onChange,
        heightClass = "h-36",
        title = "Logo",
        description = "Uploader ou choisir un logo",
        randomizeRemote = false, // kept for compatibility, now always randomizes remote selections
    } = $props<{
        logo?: { [key: string]: string };
        logos?: string[]; // list of logo URLs
        onChange: (logo: { [key: string]: string } | undefined) => void;
        heightClass?: string;
        title?: string;
        description?: string;
        randomizeRemote?: boolean;
    }>();

    let isDragging = $state(false);
    let tabValue = $state<"upload" | "choose">("upload");
    let selectedKey = $state<string | undefined>(logo ? Object.keys(logo)[0] : undefined);
    let lastSelectedUrl = $state<string | undefined>();
    let converting = $state(false);
    let conversionError = $state<string | null>(null);

    // Added helper (was missing)
    function getLogoUrl() {
        if (!logo) return undefined;
        const values = Object.values(logo);
        return values.length ? values[0] : undefined;
    }

    // Keep selectedKey in sync if parent updates logo prop externally
    $effect(() => {
        if (logo && Object.keys(logo).length) {
            const k = Object.keys(logo)[0];
            if (k !== selectedKey) selectedKey = k;
        } else if (!logo && selectedKey) {
            selectedKey = undefined;
        }
    });

    // logos values are URLs; convert to base64 when selected
    const base64Cache = new Map<string, string>();

    function deriveFileName(url: string) {
        try {
            const u = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://local");
            const last = u.pathname.split("/").filter(Boolean).pop() || "logo";
            return /\.[a-zA-Z0-9]{2,5}$/.test(last) ? last : `${last}.png`;
        } catch {
            return `logo_${Date.now()}.png`;
        }
    }

    // Added (was missing, used inside handleFile)
    function generateFileName(extension = "png") {
        return `logo_${Date.now()}_${Math.floor(Math.random() * 10000)}.${extension}`;
    }

    // Ajout: mapping mime -> extension
    const mimeExtMap: Record<string, string> = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/svg+xml": "svg",
    };

    function ensureExtension(fileName: string, mime: string) {
        const wantedExt = mimeExtMap[mime];
        if (!wantedExt) return fileName;
        const hasExt = /\.[a-zA-Z0-9]{2,5}$/.test(fileName);
        if (!hasExt) return `${fileName}.${wantedExt}`;
        // remplace si incohérent
        const currentExt = fileName.split(".").pop()?.toLowerCase();
        if (currentExt && currentExt !== wantedExt) {
            return fileName.replace(/\.[a-zA-Z0-9]{2,5}$/, `.${wantedExt}`);
        }
        return fileName;
    }

    // Removed direct client fetch + fallback (_clientFetchImageAsBase64 & try/catch logic)
    // Always go through proxy to avoid CORS issues.
    async function fetchImageAsBase64(url: string): Promise<{ base64: string; mime: string }> {
        const r = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`, {
            // no-cache to ensure latest (optional)
            headers: { Accept: "application/json" },
        });
        if (!r.ok) {
            throw new Error(`Proxy HTTP ${r.status}`);
        }
        const j = await r.json();
        if (!j.base64 || !j.mime || typeof j.base64 !== "string" || !j.mime.startsWith("image/")) {
            throw new Error("Invalid proxy response");
        }
        return { base64: j.base64, mime: j.mime };
    }

    function handleFile(file: File) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Data = event.target?.result as string;
            const extension = file.name.includes(".") ? file.name.split(".").pop() || "png" : "png";
            const fileName = generateFileName(extension);
            selectedKey = fileName;
            onChange({ [fileName]: base64Data });
        };
        reader.readAsDataURL(file);
    }

    async function selectExisting(url: string) {
        if (converting) return;
        conversionError = null;
        converting = true;
        lastSelectedUrl = url;

        // placeholder key until conversion finishes (not final)
        selectedKey = "loading...";

        try {
            let base64: string;
            let mime: string;
            if (base64Cache.has(url)) {
                base64 = base64Cache.get(url)!;
                mime = (base64.match(/^data:(.*?);/)?.[1] || "").toLowerCase();
                if (!mime.startsWith("image/")) throw new Error("Cached entry not image");
            } else {
                const res = await fetchImageAsBase64(url);
                base64 = res.base64;
                mime = res.mime;
                base64Cache.set(url, base64);
            }

            const ext = mimeExtMap[mime] || mime.split("/").pop() || "png";
            let fileName = generateFileName(ext); // ALWAYS random now
            fileName = ensureExtension(fileName, mime);
            selectedKey = fileName;
            onChange({ [fileName]: base64 });
        } catch (e: any) {
            const msg = /Failed to fetch|CORS|HTTP 40\d|not an image/i.test(String(e))
                ? "Conversion impossible (CORS ou ressource non image)."
                : "Conversion du logo échouée.";
            conversionError = msg;
            selectedKey = undefined;
            lastSelectedUrl = undefined;
        } finally {
            converting = false;
        }
    }

    function clearSelection() {
        selectedKey = undefined;
        lastSelectedUrl = undefined;
        onChange(undefined);
        conversionError = null;
    }
</script>

<Card.Root>
    <Card.Header>
        <Card.Title class="flex items-center gap-2">
            <Image class="size-5" />
            {title}
        </Card.Title>
        <Card.Description>{description}</Card.Description>
    </Card.Header>
    <Card.Content class="pt-2">
        <Tabs.Root bind:value={tabValue} class="flex flex-col gap-4">
            <Tabs.List class="w-full">
                <Tabs.Trigger value="upload">Uploader</Tabs.Trigger>
                <Tabs.Trigger value="choose">Choisir</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="upload" class="mt-0">
                <div class="flex gap-2">
                    <!-- Dropzone -->
                    <div
                        class={`flex flex-1 ${heightClass} cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-4 text-center transition-colors hover:bg-muted/50 ${isDragging ? "bg-muted/70" : ""}`}
                        role="button"
                        tabindex="0"
                        aria-label="Upload logo"
                        on:click={() => document.getElementById("logo-upload")?.click()}
                        on:keydown={(e) =>
                            (e.key === "Enter" || e.key === " ") && document.getElementById("logo-upload")?.click()}
                        on:dragenter|preventDefault={() => (isDragging = true)}
                        on:dragover|preventDefault={() => (isDragging = true)}
                        on:dragleave={() => (isDragging = false)}
                        on:drop|preventDefault={(e) => {
                            isDragging = false;
                            const file = e.dataTransfer?.files?.[0];
                            if (file) handleFile(file);
                        }}>
                        <Upload class="size-8 text-muted-foreground" />
                        <p class="text-xs text-muted-foreground">{$t("drag_drop_or_click")}</p>
                    </div>

                    <!-- Preview -->
                    <div
                        class={`relative flex w-1/3 items-center justify-center overflow-hidden rounded-md border ${heightClass} bg-muted/30`}>
                        {#if getLogoUrl()}
                            <img src={getLogoUrl()} alt="Logo preview" class="h-36 w-auto object-contain" />
                            <button
                                type="button"
                                class="absolute right-2 top-2 rounded-full border border-border bg-background/80 p-1 text-foreground shadow transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                on:click={clearSelection}
                                aria-label="Remove logo">
                                <X class="size-4" />
                            </button>
                        {:else}
                            <p class="px-4 text-center text-sm text-muted-foreground">
                                {$t("no_image_selected")}
                            </p>
                        {/if}
                    </div>
                </div>
                <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    on:change={(e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleFile(file);
                    }} />
            </Tabs.Content>

            <Tabs.Content value="choose" class="mt-0">
                <div class={`relative ${heightClass} overflow-y-auto rounded-md border p-2`} aria-busy={converting}>
                    {#if logos.length > 0}
                        <div class="grid grid-cols-2 gap-2">
                            {#each logos as url}
                                <button
                                    type="button"
                                    class={`relative flex h-36 w-full items-center justify-center overflow-hidden rounded-md border bg-muted/30 transition hover:ring-2 hover:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
										${converting ? "pointer-events-none opacity-50" : ""} ${lastSelectedUrl === url ? "ring-2 ring-primary" : ""}`}
                                    on:click={() => selectExisting(url)}
                                    disabled={converting}
                                    aria-label="Choisir logo">
                                    <img src={url} alt="logo" class="h-full w-auto object-contain" />
                                    {#if lastSelectedUrl === url}
                                        <span
                                            class="pointer-events-none absolute inset-0 bg-primary/30"
                                            aria-hidden="true" />
                                    {/if}
                                </button>
                            {/each}
                        </div>
                    {:else}
                        <div class="flex h-full items-center justify-center text-center">
                            <div class="flex flex-col items-center gap-2 px-4 text-xs text-muted-foreground">
                                <CircleAlert class="size-6" />
                                <span>Vous devez sélectionner un jeu pour afficher les suggestions de logo</span>
                            </div>
                        </div>
                    {/if}

                    {#if converting}
                        <div class="absolute inset-0 flex items-center justify-center backdrop-blur-sm">
                            <span class="rounded bg-background/80 px-2 py-1 text-xs">Conversion...</span>
                        </div>
                    {/if}
                </div>

                {#if conversionError}
                    <p class="mt-2 text-xs text-destructive">{conversionError}</p>
                {/if}

                {#if selectedKey && logos.length > 0}
                    <div class="flex items-center gap-2 pt-2">
                        <p class="flex-1 truncate text-xs text-muted-foreground">{selectedKey}</p>
                        <button type="button" class="text-xs text-destructive underline" on:click={clearSelection}>
                            Supprimer
                        </button>
                    </div>
                {/if}
            </Tabs.Content>
        </Tabs.Root>
    </Card.Content>
</Card.Root>

<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import LazyImage from "./LazyImage.svelte";
    import Loader from "./Loader.svelte";
    import type { InstallableGame } from "$src/lib/shared-models";
    import type { InstallableGameExtended } from "$src/lib/types";
    import Button from "../ui/button/button.svelte"; // NEW
    import { cn, getGameResourceUrl } from "$src/lib/utils";

    let {
        games = [],
        interval = 6000,
        autoplay = true,
        loading = false,
        minHeight = 360,
        class: klass,
    }: {
        games: InstallableGameExtended[];
        interval?: number;
        autoplay?: boolean;
        loading?: boolean;
        minHeight?: number;
        class?: string;
    } = $props();

    let current = $state(0);
    let startTs = 0;
    let elapsed = $state(0);
    let raf: number | null = null;
    const hasRAF = typeof window !== "undefined";
    let paused = $state(false);

    // Choose the large visual (mirror GameCard logic: first screenshot else cover)
    const mainImage = (g: InstallableGameExtended) => {
        const shot = g?.screenshots?.[0];
        const img = shot || g?.cover;
        return img ? getGameResourceUrl(g, img) : "";
    };

    const thumbImage = (g: InstallableGameExtended) =>
        g?.cover ? getGameResourceUrl(g, g.cover) : g?.screenshots?.[0] ? getGameResourceUrl(g, g.screenshots[0]) : "";

    // Helper to get logo if present (adjust property name if different, e.g. g.logoImage / g.logoPath)
    const logoImage = (g: InstallableGameExtended) => getGameResourceUrl(g, g.logo);

    function wrapIndex(i: number, len: number) {
        return ((i % len) + len) % len;
    }

    function goto(i: number) {
        if (!games.length) return;
        current = wrapIndex(i, games.length);
        elapsed = 0;
        // pendingAdvance = false; // REMOVED
        startTs = performance.now();
    }
    const next = () => goto(current + 1);
    const prev = () => goto(current - 1);

    function frame(ts: number) {
        if (!paused && autoplay && games.length) {
            elapsed = ts - startTs;
            if (elapsed >= interval) {
                next(); // goto() resets startTs & elapsed
                elapsed = 0; // explicit for clarity
            }
        } else {
            startTs = ts - elapsed;
        }
        if (hasRAF) raf = requestAnimationFrame(frame); // ALWAYS schedule next frame
    }

    onMount(() => {
        if (!hasRAF) return;
        startTs = performance.now();
        raf = requestAnimationFrame(frame);
    });

    onDestroy(() => {
        if (hasRAF && raf !== null) cancelAnimationFrame(raf);
    });

    const key = (e: KeyboardEvent) => {
        if (e.key === "ArrowRight") next();
        else if (e.key === "ArrowLeft") prev();
    };

    // Derived progress (unchanged logic, now no pendingAdvance clamp frame)
    const progress = $derived(games.length ? Math.min(1, elapsed / interval) : 0);

    // Clamp current if games array changes (avoid out-of-range)
    $effect(() => {
        if (current >= games.length) current = games.length ? games.length - 1 : 0;
    });
</script>

<!-- Removed mb-6 (duplicate with parent section) and h-1/2 (was inflating height).
     Parent can now control spacing via <FeaturedGame class="mb-6" ...> if desired. -->
<div
    class={cn(
        // Added box-border (prevents padding increasing width) and overflow-x-clip (guards subpixel overflow)
        "group relative box-border aspect-[16/9] w-full max-w-full overflow-hidden overflow-x-clip bg-card ring-1 ring-border",
        klass,
    )}
    style={`min-height:${minHeight}px;`}
    tabindex="0"
    onkeydown={key}
    onmouseenter={() => (paused = true)}
    onmouseleave={() => (paused = false)}
    onfocus={() => (paused = true)}
    onblur={() => (paused = false)}>
    {#if loading}
        <div class="absolute inset-0 animate-pulse bg-gradient-to-br from-background via-muted to-background" />
    {:else if !games.length}
        <div class="absolute inset-0 flex items-center justify-center text-sm opacity-70">No featured games</div>
    {:else}
        {#each games as g, i}
            <div
                class="absolute inset-0 transition-opacity duration-700"
                style="opacity:{i === current ? 1 : 0}"
                class:pointer-events-none={i !== current}>
                <!-- CHANGED: wrap background visual with anchor -->
                <a href={"/games/" + g.folderSlug} class="block h-full w-full" aria-label={"Open " + g.title}>
                    {#if mainImage(g)}
                        <LazyImage
                            placeholderHeight="100%"
                            placeholderWidth="100%"
                            src={mainImage(g)}
                            class="h-full w-full object-cover">
                            <Loader size={32} />
                        </LazyImage>
                    {:else}
                        <div class="flex h-full w-full items-center justify-center bg-secondary text-xl">
                            {g.title}
                        </div>
                    {/if}
                </a>

                <!-- REPLACED top shadow: was subtle inline style, now stronger & tailwind-based -->
                <div
                    class="pointer-events-none absolute inset-x-0 top-0 z-10 h-[60%] bg-gradient-to-b from-black/70 via-black/40 to-transparent">
                </div>

                <!-- THEME GRADIENTS (vertical & horizontal) -->
                <div
                    class="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
                    style="background:linear-gradient(to top,
                        hsl(var(--background)/0.85) 0%,
                        hsl(var(--background)/0.55) 55%,
                        hsl(var(--background)/0) 100%);">
                </div>
                <div
                    class="pointer-events-none absolute inset-y-0 left-0 w-1/3"
                    style="background:linear-gradient(to right,
                        hsl(var(--background)/0.70) 0%,
                        hsl(var(--background)/0.45) 45%,
                        hsl(var(--background)/0) 100%);">
                </div>

                <div class="absolute bottom-16 left-0 right-auto z-20 flex max-w-xl flex-col gap-2 p-6 text-foreground">
                    <h2 class="text-2xl font-bold drop-shadow">
                        <a
                            href={"/games/" + g.folderSlug}
                            class="inline-block align-middle hover:underline focus:underline focus:outline-none">
                            {#if logoImage(g)}
                                <img
                                    src={logoImage(g)}
                                    alt={g.title + " logo"}
                                    class="h-26 w-auto max-w-full object-contain drop-shadow-md" />
                            {:else}
                                {g.title}
                            {/if}
                        </a>
                    </h2>
                    {#if g.description}
                        <p class="whitespace-pre-line break-words text-sm leading-relaxed opacity-90">
                            {g.description}
                        </p>
                    {/if}
                </div>
            </div>
        {/each}

        <!-- Navigation buttons (now only visible on hover / focus) -->
        <Button
            type="button"
            variant="ghost"
            class="pointer-events-none absolute left-2 top-1/2 z-50 grid h-9 w-9 -translate-y-1/2 place-content-center rounded-md bg-background/50 text-foreground opacity-0 transition-opacity duration-200 hover:bg-background/70 focus:pointer-events-auto focus:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100"
            onclick={prev}
            aria-label="Previous">
            ‹
        </Button>
        <Button
            type="button"
            variant="ghost"
            class="pointer-events-none absolute right-2 top-1/2 z-50 grid h-9 w-9 -translate-y-1/2 place-content-center rounded-md bg-background/50 text-foreground opacity-0 transition-opacity duration-200 hover:bg-background/70 focus:pointer-events-auto focus:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100"
            onclick={next}
            aria-label="Next">
            ›
        </Button>

        <!-- Thumbnail rail with per-thumbnail progress (replaced native button) -->
        <div class="absolute bottom-0 left-0 right-0 flex justify-center gap-2 px-4 pb-2">
            {#each games as g, i}
                <Button
                    type="button"
                    variant="ghost"
                    aria-label={"Go to slide " + (i + 1)}
                    class="group relative min-w-0 overflow-hidden rounded p-0 ring-1 ring-border focus:outline-none {i ===
                    current
                        ? 'ring-2 ring-primary'
                        : ''} {g.cover ? 'aspect-[2/3] h-16 w-12' : 'aspect-[16/9] h-12 w-20'}"
                    onclick={() => goto(i)}
                    onmouseenter={() => goto(i)}>
                    {#if thumbImage(g)}
                        <LazyImage
                            src={thumbImage(g)}
                            alt={g.title + " thumbnail"}
                            class="block h-full w-full object-cover opacity-70 transition-opacity group-hover:opacity-100" />
                    {:else}
                        <span class="break-words px-1 text-[10px] text-foreground/80">{g.title}</span>
                    {/if}
                    <div
                        class="absolute inset-0 bg-background/50 {i === current
                            ? 'opacity-0'
                            : 'opacity-50'} transition-opacity group-hover:opacity-0" />
                    <div class="absolute inset-x-0 bottom-0 h-1 bg-muted/40">
                        <div class="h-full bg-primary" style={`width:${i === current ? progress * 100 : 0}%;`}></div>
                    </div>
                </Button>
            {/each}
        </div>

        {#if paused}
            <div
                class="absolute right-2 top-2 rounded bg-background/70 px-2 py-1 font-mono text-[10px] text-foreground">
                {Math.ceil((interval - elapsed) / 1000)}s
            </div>
        {/if}
    {/if}
</div>

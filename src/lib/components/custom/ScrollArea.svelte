<!-- src/lib/ui/ScrollAreaDebug.svelte -->
<script lang="ts">
    import { fade } from "svelte/transition";

    let wrap: HTMLDivElement, vp: HTMLDivElement, thumb: HTMLDivElement;

    const { thickness = 6, minThumb = 24 } = $props<{ thickness?: number; minThumb?: number }>();

    let raf = $state<number | null>(null);
    let maxTop = $state(0);

    // New state for fade visibility
    let hasOverflow = $state(false);
    let atBottom = $state(true);
    let scrolling = $state(false);
    let showShadow = $state(false);
    let scrollTimeout = $state<number>(0);

    const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

    function layout() {
        const ch = vp.clientHeight,
            sh = vp.scrollHeight;
        const trackH = wrap.clientHeight;
        const ratio = ch / sh;
        const thumbH = sh > ch ? Math.max(minThumb, Math.floor(trackH * ratio)) : trackH;
        maxTop = Math.max(0, trackH - thumbH);
        thumb.style.height = `${thumbH}px`;
        position();
        hasOverflow = vp.scrollHeight > vp.clientHeight;
        updateAtBottom();
    }
    function position() {
        const ch = vp.clientHeight,
            sh = vp.scrollHeight,
            st = vp.scrollTop;
        const top = (st / Math.max(1, sh - ch)) * maxTop;
        thumb.style.transform = `translateY(${clamp(top, 0, maxTop)}px)`;
    }
    function updateAtBottom() {
        atBottom = vp.scrollTop + vp.clientHeight >= vp.scrollHeight - 1;
        updateShadow();
    }
    function updateShadow() {
        showShadow = hasOverflow && !atBottom && !scrolling;
    }
    function onScroll() {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
            position();
            updateAtBottom();
        });
        scrolling = true;
        updateShadow();
        clearTimeout(scrollTimeout);
        scrollTimeout = window.setTimeout(() => {
            scrolling = false;
            updateShadow();
        }, 160);
    }

    let ro: ResizeObserver, mo: MutationObserver;
    $effect(() => {
        vp.addEventListener("scroll", onScroll, { passive: true });
        ro = new ResizeObserver(layout);
        ro.observe(vp);
        ro.observe(wrap);
        mo = new MutationObserver(layout);
        mo.observe(vp, { childList: true, subtree: true, characterData: true });

        queueMicrotask(layout);
        raf = requestAnimationFrame(layout); // ensure post-paint measurement
        return () => {
            vp.removeEventListener("scroll", onScroll);
            ro?.disconnect();
            mo?.disconnect();
        };
    });
</script>

<div bind:this={wrap} class="wrap">
    <div bind:this={vp} class="viewport">
        <slot />
    </div>
    {#if showShadow}
        <!-- Inline-styled bottom fade overlay -->
        <div
            transition:fade={{ duration: 100 }}
            aria-hidden="true"
            style="
                position:absolute;
                left:0;
                right:0;
                bottom:0;
                height:2.5rem;
                pointer-events:none;
                z-index:2147483646;
                background: linear-gradient(
                    to top,
                    var(--background) / 0.75 0%,
                    var(--background) / 0.0 100%
                );

            " />
    {/if}
    <!-- Track + Thumb only visible on hover -->
    <div class="track" style={`width:${thickness}px`}>
        <div bind:this={thumb} class="thumb" style="width:100%"></div>
    </div>
</div>

<style>
    .wrap {
        position: relative;
        /* garantit que le z-index interne passe au-dessus des enfants */
        isolation: isolate;
        /* IMPORTANT pour remplir l'espace restant en parent flex */
        min-height: 0;
        height: 100%;
    }
    .viewport {
        height: 100%;
        overflow: auto;
        /* masque la native partout */
        scrollbar-width: none;
    }
    .viewport::-webkit-scrollbar {
        width: 0;
        height: 0;
    }

    .track {
        position: absolute;
        top: 0;
        bottom: 0;
        right: 0;
        z-index: 2147483647;
        background: transparent;
        /* hidden by default */
        opacity: 0;
        pointer-events: none;
        transition: opacity 120ms;
    }
    .wrap:hover .track {
        opacity: 1;
        pointer-events: auto;
    }
    .thumb {
        position: absolute;
        top: 0;
        right: 0;
        border-radius: 10px;
        background-color: var(--muted) / 0.5;
        border: 2px solid var(--border) / var(--tw-border-opacity, 1);
        transition: background-color 120ms;
    }
    .wrap:hover .thumb {
        background-color: var(--muted-foreground) / 0.7;
    }
    .thumb:active,
    .wrap:active .thumb {
        background-color: var(--muted-foreground) / 0.9;
    }
</style>

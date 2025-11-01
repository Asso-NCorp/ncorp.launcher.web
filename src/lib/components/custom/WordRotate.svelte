<script lang="ts">
    import { cn } from "$lib/utils";
    import { fly } from "svelte/transition";

    export let word: string = "";
    export let minCh: number | undefined; // reserve width (fallback)
    export let longest: string | undefined; // explicit widest word to reserve exact width
    let className: string = "";
    export { className as class };
</script>

<div
    class="overflow-hidden inline-grid align-middle justify-items-center"
    style={(!longest && minCh) ? `min-width:${minCh}ch` : undefined}>
    {#if longest}
        <!-- Hidden placeholder reserves final width (no reflow when word changes) -->
        <span aria-hidden="true" class="invisible whitespace-pre">{longest}</span>
    {/if}
    {#key word}
        <span
            class="col-start-1 row-start-1 inline-block text-center leading-tight {className}"
            in:fly={{ y: -50, delay: 120 }}
            out:fly={{ y: 40, duration: 160 }}>
            {word}
        </span>
    {/key}
</div>

<style>
    /* Subtle radial shadow behind the word for readability */
    .word-shadow {
        position: relative;
    }
    .word-shadow::before {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 50% 55%,
            rgba(0,0,0,0.45) 0%,
            rgba(0,0,0,0.35) 35%,
            rgba(0,0,0,0.15) 55%,
            rgba(0,0,0,0) 75%);
        filter: blur(4px);
        z-index: -1;
        pointer-events: none;
    }
</style>

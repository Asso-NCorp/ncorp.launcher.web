<script lang="ts">
    import { fade } from "svelte/transition";
    import Loader from "./Loader.svelte";

    let {
        visible = false,
    }: {
        visible?: boolean;
    } = $props();

    // Action to portal element to body
    function portal(node: HTMLElement) {
        document.body.appendChild(node);
        return {
            destroy() {
                node.remove();
            }
        };
    }
</script>

{#if visible}
    <div
        use:portal
        transition:fade={{ duration: 200 }}
        class="bg-background fixed inset-0 flex items-center justify-center"
        style="z-index: 2147483647;">
        <!-- Background image with fade mask -->
        <img
            src="https://medias.n-corp.fr/ncorp/games/hytale/screenshot_full_1.webp"
            alt=""
            class="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30 mask-[linear-gradient(to_bottom,black_30%,transparent_80%)]" />
        <div class="relative flex flex-col items-center gap-3">
            <img src="/logo_small.png" alt="Logo" width="40" height="40" />
            <Loader size={40} class="absolute" />
        </div>
    </div>
{/if}

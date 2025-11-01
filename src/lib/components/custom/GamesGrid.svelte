<script lang="ts">
    import type { InstallableGameExtended } from "$src/lib/types";
    import GameCard from "./GameCard.svelte";
    import LazyLoad from "./LazyLoad.svelte";
    import { fly } from "svelte/transition";

    let { games }: { games: InstallableGameExtended[] } = $props();
</script>

<div class="grid w-full grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4 px-1 py-3">
    {#each games as game, i}
        <LazyLoad class="h-full w-full">
            <div
                
                class="h-full w-full">
                <GameCard {game} />
            </div>
        </LazyLoad>
    {/each}
</div>

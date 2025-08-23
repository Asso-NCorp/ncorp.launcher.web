<script lang="ts">
    import type { InstallableGameExtended } from "$src/lib/types";
    import GameCard from "./GameCard.svelte";
    import { fly } from "svelte/transition";

    let { games }: { games: InstallableGameExtended[] } = $props();
</script>

<div class="grid w-full grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4 px-1 py-3">
    {#each games as game, i}
        <div class="h-full w-full" in:fly|global={{ x: 20, duration: 100, delay: i * 30 }}>
            <GameCard {game} />
        </div>
    {/each}
</div>

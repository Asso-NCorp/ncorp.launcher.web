<script lang="ts">
    import type { Snippet } from "svelte";
    import NcorpGlitch from "./NcorpGlitch.svelte";
    import { GamesStore } from "$src/lib/stores/games.svelte";
    import { Progress } from "../ui/progress";
    import { fly } from "svelte/transition";
    import { cn } from "$src/lib/utils";
    import GridPattern from "./GridPattern.svelte";
    import Card from "../ui/card/card.svelte";
    import Loader from "./Loader.svelte";

    let {
        children,
        class: klazz,
        loading = false,
    }: {
        children?: Snippet;
        class?: string;
        loading?: boolean;
    } = $props();
</script>

<header>
    <Card class={cn("flex h-auto items-center gap-2", klazz)}>
        <img src="/logo_small.png" alt="Logo" class="h-12 w-auto border-primary py-1 pl-2" />
        <!-- Vertical divided -->
        <div class="h-8 w-[1px] bg-border" />
        <NcorpGlitch
            class="inline-block font-clash text-lg font-semibold tracking-widest"
            text="NCORP"
            glitchEnabled={false} />
        {#if loading}
            <Loader size={24} class="text-primary" />
        {/if}

        <div class="w-full px-40">
            {#each GamesStore.games.filter((g) => g.isInstalling) as game}
                <div in:fly={{ y: -50, delay: 200 }} out:fly={{ y: 40, duration: 200 }} class="flex items-center gap-2">
                    <a href="/games/{game.folderSlug}" class="w-auto text-nowrap text-sm font-bold hover:underline">
                        {game.title}
                    </a>
                    <Progress class="h-1" value={game.installProgress} />
                    <span class="text-sm">{game.installProgress}%</span>
                </div>
            {/each}
        </div>

        {@render children?.()}

        <GridPattern
            width={20}
            height={20}
            strokeDashArray="4 2"
            fillColor="rgb(156 163 175 / 0.1)"
            class={cn("[mask-image:radial-gradient(1200px_circle_at_center,white,transparent)]")} />
    </Card>
</header>

<style>
    header {
        view-transition-name: header;
    }
</style>

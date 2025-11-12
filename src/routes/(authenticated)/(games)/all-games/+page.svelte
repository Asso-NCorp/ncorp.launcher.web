<script lang="ts">
    import GamesDataTable from "$src/lib/components/custom/GamesDataTable.svelte";
    import GamesGrid from "$src/lib/components/custom/GamesGrid.svelte";
    import LiveServerCard from "$src/lib/components/custom/LiveServerCard.svelte";
    import { ArrowBigDownDash, RefreshCw, Server } from "@lucide/svelte";
    import { Button } from "$src/lib/components/ui/button";
    import { fly } from "svelte/transition";
    import { GamesStore } from "$src/lib/states/games.svelte";
    import { global } from "$src/lib/states/global.svelte";
    import { cleanHeadMenu, setHeadMenu } from "../layout-slots.svelte";
    import * as Tooltip from "$src/lib/components/ui/tooltip";
    import { Badge } from "$src/lib/components/ui/badge";
    import { t } from "$src/lib/translations";
    import BlurFade from "$src/lib/components/custom/BlurFade.svelte";
    import FeaturedGame from "$src/lib/components/custom/FeaturedGame.svelte";
    import { browser } from "$app/environment";
    import type { LayoutProps } from "../$types";
    import type { DetectedServer } from "$lib/utils/liveServers";
    import { getLiveServers } from "../liveServers.remote";

    // Sort all games by title asc
    const sortedGames = $derived([...GamesStore.games].sort((a, b) => a.title.localeCompare(b.title)));
    const filteredGames = $derived(sortedGames.filter((game) => game.isSelected && !game.isInstalled));
    const featuredGames = sortedGames.filter((game) => game.isFeatured).slice(0, 10);
    const { data }: LayoutProps = $props();
    let liveServers = $state<DetectedServer[]>(data.liveServers ?? []);

    let refreshing = $state(false);

    async function refreshLiveServers() {
        refreshing = true;
        try {
            const servers = await getLiveServers();
            liveServers = servers;
        } finally {
            refreshing = false;
        }
    }

    $effect(() => {
        setHeadMenu(head, title);
        return cleanHeadMenu;
    });
</script>

{#snippet title()}
    {#if featuredGames.length > 0}
        <!-- Featured slider placed before search bar (which lives outside this file) -->
        <div class="mb-6 flex flex-col gap-2">
            <BlurFade delay={0.3} class="text-3xl font-bold">Jeux en vedette</BlurFade>
            <div class="overflow-hidden px-1">
                <FeaturedGame games={featuredGames} loading={GamesStore.isLoading} interval={5000} class="h-120" />
            </div>
        </div>
    {/if}

    <div class="flex items-center gap-3 py-2">
        <BlurFade delay={0.3} class="text-3xl font-bold">Serveurs de jeu actifs</BlurFade>
        <Tooltip.Root>
            <Tooltip.Trigger>
                <Button
                    variant="ghost"
                    size="icon"
                    onclick={refreshLiveServers}
                    disabled={refreshing}
                    class="h-8 w-8">
                    <RefreshCw class="size-4 {refreshing ? 'animate-spin' : ''}" />
                </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>
                <p>Rafraîchir les serveurs actifs</p>
            </Tooltip.Content>
        </Tooltip.Root>
    </div>
    {#if liveServers.length > 0}
        <div class="flex gap-4 overflow-x-auto pb-2">
            {#each liveServers as server}
                {@const serverGame = GamesStore.games.find((game) => game.folderSlug === server.gameSlug)}
                {#if serverGame}
                    <LiveServerCard {server} game={serverGame} disabled={refreshing} />
                {/if}
            {/each}
        </div>
    {:else}
        <div class="border-border bg-muted/30 my-4 flex items-center justify-center rounded-lg border border-dashed p-8">
            <div class="text-muted-foreground flex flex-col items-center gap-2 text-center">
                <Server class="size-12 opacity-50" />
                <p class="text-sm font-medium">Aucun serveur actif pour le moment</p>
                <p class="text-xs opacity-70">Les serveurs de jeu apparaîtront ici quand ils seront en ligne</p>
            </div>
        </div>
    {/if}

    <BlurFade delay={0.3} class="text-3xl py-2 font-bold">Liste de tous les jeux disponibles</BlurFade>
{/snippet}
{#snippet head()}
    {#if GamesStore.selected.length > 0}
        <div transition:fly={{ y: -10, duration: 200 }} class="gap-2">
            <Tooltip.Root>
                <Tooltip.Trigger>
                    <Button
                        onclick={() => {
                            GamesStore.installGames(filteredGames);
                        }}
                        variant="outline"
                        class="border-l-0">
                        <ArrowBigDownDash />
                        {$t("install_selection")}
                        {#key GamesStore.selected}
                            <div in:fly={{ y: -10, duration: 200 }}>
                                <Badge variant="secondary" class="ml-2">
                                    {filteredGames.length}
                                </Badge>
                            </div>
                        {/key}
                    </Button>
                </Tooltip.Trigger>
                <Tooltip.Content>
                    <p>{GamesStore.selected.map((game) => game.title).join(", ")}</p>
                </Tooltip.Content>
            </Tooltip.Root>
        </div>
    {/if}
{/snippet}

{#if browser}
    <div class="mt-0">
        {#if global.gamesDisplayMode === "grid"}
            <GamesGrid games={sortedGames} />
        {:else}
            <GamesDataTable games={sortedGames} loading={GamesStore.isLoading} />
        {/if}
    </div>
{/if}

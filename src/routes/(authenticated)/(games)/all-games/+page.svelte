<script lang="ts">
    import GamesDataTable from "$src/lib/components/custom/GamesDataTable.svelte";
    import GamesGrid from "$src/lib/components/custom/GamesGrid.svelte";
    import { ArrowBigDownDash, ArrowBigUpDash } from "@lucide/svelte";
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
    import ScrollArea from "$src/lib/components/ui/scroll-area/scroll-area.svelte";
    // Sort all games by title asc
    const sortedGames = $derived([...GamesStore.games].sort((a, b) => a.title.localeCompare(b.title)));
    const filteredGames = $derived(sortedGames.filter((game) => game.isSelected && !game.isInstalled));
    const featuredGames = 
        sortedGames
            .filter((game) => game.isFeatured)
            .sort((a, b) => Number(b.dateUpdated ?? 0) - Number(a.dateUpdated ?? 0))
            .slice(0, 10);
            
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
            <div class="px-1 overflow-hidden">
                <FeaturedGame games={featuredGames} loading={GamesStore.isLoading} interval={5000} class="h-120" />
            </div>
        </div>
    {/if}
    <BlurFade delay={0.3} class="text-3xl font-bold">Liste de tous les jeux disponibles</BlurFade>
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
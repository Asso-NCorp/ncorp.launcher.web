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

    setHeadMenu(head, title);

    let filteredGames = $derived(GamesStore.games.filter((game) => game.isSelected && !game.isInstalled));
    const featuredGames = $derived(GamesStore.games.filter((game) => game.isFeatured).slice(0, 5));
    $effect(() => {
        return cleanHeadMenu;
    });
</script>

{#snippet title()}
    {#if featuredGames.length > 0}
        <!-- Featured slider placed before search bar (which lives outside this file) -->
        <div class="mb-6 flex flex-col gap-2">
            <BlurFade delay={0.3} class="text-3xl font-bold">Jeux en vedette</BlurFade>
            <div class="px-1">
                <FeaturedGame games={featuredGames} loading={GamesStore.isLoading} interval={5000} class="h-[30rem]" />
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

<!-- Single scroll context: removed inner overflow/max-h container -->
<div class="mt-0">
    {#if global.gamesDisplayMode === "grid"}
        <GamesGrid games={GamesStore.games} />
    {:else}
        <GamesDataTable games={GamesStore.games} loading={GamesStore.isLoading} />
    {/if}
</div>

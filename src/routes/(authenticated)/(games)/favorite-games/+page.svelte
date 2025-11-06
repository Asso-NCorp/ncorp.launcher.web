<script lang="ts">
    import GamesDataTable from "$src/lib/components/custom/GamesDataTable.svelte";
    import GamesGrid from "$src/lib/components/custom/GamesGrid.svelte";
    import { ArrowBigUpDash, Heart } from "@lucide/svelte";
    import ScrollArea from "$src/lib/components/ui/scroll-area/scroll-area.svelte";
    import { Button } from "$src/lib/components/ui/button";
    import { fly } from "svelte/transition";
    import { GamesStore } from "$src/lib/states/games.svelte";
    import { global } from "$src/lib/states/global.svelte";
    import { cleanHeadMenu, setHeadMenu } from "../layout-slots.svelte";
    import { Badge } from "$src/lib/components/ui/badge";
    import BlurFade from "$src/lib/components/custom/BlurFade.svelte";
    import { t } from "$src/lib/translations";

    let filteredGames = $derived(
        [...GamesStore.games].sort((a, b) => a.title.localeCompare(b.title)).filter((game) => game.isFavorite),
    );

    // Defer registration until snippets exist; ensure cleanup fires.
    $effect(() => {
        if (typeof head === "function" && typeof title === "function") {
            setHeadMenu(head, title);
        }
        return cleanHeadMenu;
    });
</script>

{#snippet title()}
    <BlurFade delay={0.3} class="flex items-center gap-2 text-3xl font-bold">
        <Heart class="text-red-500" fill="currentColor" />
        {$t("favorite_games")}
    </BlurFade>
{/snippet}
{#snippet head()}
    {#if filteredGames.length > 0}
        <div transition:fly={{ y: -10, duration: 200 }} class="flex gap-2">
            <span class="text-muted-foreground text-sm">
                {$t("favorite_games")}:
                <Badge variant="secondary" class="ml-2">
                    {filteredGames.length}
                </Badge>
            </span>
        </div>
    {/if}
{/snippet}

{#if filteredGames.length === 0}
    <div class="flex flex-col items-center justify-center gap-4 py-12">
        <Heart class="text-muted-foreground h-16 w-16 opacity-50" />
        <p class="text-muted-foreground text-lg">{$t("no_element_found")}</p>
    </div>
{:else if global.gamesDisplayMode === "grid"}
    <ScrollArea class="flex-1">
        <GamesGrid games={filteredGames} />
    </ScrollArea>
{:else}
    <ScrollArea class="flex-1">
        <GamesDataTable games={filteredGames} loading={GamesStore.isLoading} />
    </ScrollArea>
{/if}

<script lang="ts">
    import GamesDataTable from "$src/lib/components/custom/GamesDataTable.svelte";
    import GamesGrid from "$src/lib/components/custom/GamesGrid.svelte";
    import { ArrowBigUpDash } from "@lucide/svelte";
    import ScrollArea from "$src/lib/components/ui/scroll-area/scroll-area.svelte";
    import { Button } from "$src/lib/components/ui/button";
    import { fly } from "svelte/transition";
    import { GamesStore } from "$src/lib/states/games.svelte";
    import { global } from "$src/lib/states/global.svelte";
    import { cleanHeadMenu, setHeadMenu } from "../layout-slots.svelte";
    import { Badge } from "$src/lib/components/ui/badge";
    import BlurFade from "$src/lib/components/custom/BlurFade.svelte";

    let filteredGames = $derived(GamesStore.games.filter((game) => game.isSelected && game.isInstalled));

    // Defer registration until snippets exist; ensure cleanup fires.
    $effect(() => {
        if (typeof head === "function" && typeof title === "function") {
            setHeadMenu(head, title);
        }
        return cleanHeadMenu;
    });
</script>

{#snippet title()}
    <BlurFade delay={0.3} class="text-3xl font-bold">Liste des jeux installés</BlurFade>
{/snippet}
{#snippet head()}
    {#if GamesStore.selected.length > 0}
        <div transition:fly={{ y: -10, duration: 200 }} class="flex gap-2">
            <Button onclick={() => GamesStore.uninstallGames(filteredGames)} variant="outline">
                <ArrowBigUpDash /> Désinstaller la sélection
                {#key GamesStore.selected}
                    <div in:fly={{ y: -10, duration: 200 }}>
                        <Badge variant="secondary" class="ml-2">
                            {filteredGames.length}
                        </Badge>
                    </div>
                {/key}
            </Button>
        </div>
    {/if}
{/snippet}

{#if global.gamesDisplayMode === "grid"}
    <ScrollArea class="flex-1">
        <GamesGrid games={GamesStore.games.filter((game) => game.isInstalled || game.isInstalling)} />
    </ScrollArea>
{:else}
    <ScrollArea class="flex-1">
        <GamesDataTable
            games={GamesStore.games.filter((game) => game.isInstalled || game.isInstalling)}
            loading={GamesStore.isLoading} />
    </ScrollArea>
{/if}

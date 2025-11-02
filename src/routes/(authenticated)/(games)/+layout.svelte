<script lang="ts">
    import GamesSearchBar from "$src/lib/components/custom/GamesSearchBar.svelte";
    import * as ToggleGroup from "$lib/components/ui/toggle-group";
    import Grid_3x3 from "@lucide/svelte/icons/grid-3x3";
    import { List } from "@lucide/svelte";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import { onMount, type Snippet } from "svelte";
    import { global, type GameDisplayMode } from "$src/lib/states/global.svelte";
    import { initHeadMenu } from "./layout-slots.svelte";
    import { GamesStore } from "$src/lib/states/games.svelte";
    import { onNavigate } from "$app/navigation";
    import type { LayoutData, PageData } from "../$types";

    let { children, data }: { children?: Snippet; data: PageData } = $props();

    const slots = initHeadMenu();

    onNavigate(() => {
        GamesStore.resetSelected();
    });
    /* onMount(async () => {
        if (GamesStore.games.length === 0) {
            await GamesStore.getAvailableGames();
        }
    }); */
</script>

<!-- Root fills available space; inner scroller hosts title + sticky bar + children -->
<div class="flex flex-col">
    {#if slots.title}
        {@render slots.title()}
    {/if}

    <!-- Sticky search / controls bar inside the scrolling container -->
    <div
        class="border-border bg-background/80 supports-backdrop-filter:bg-background/90 sticky top-0 z-40 flex items-center justify-between gap-4 border-b px-0 py-2 pr-2 backdrop-blur">
        <GamesSearchBar recentGames={data.recentGames} />
        {#if slots.head}
            {@render slots.head()}
        {/if}
        <ToggleGroup.Root
            class="ml-auto"
            size="lg"
            type="single"
            value={global.gamesDisplayMode}
            onValueChange={(value) => (global.gamesDisplayMode = value as GameDisplayMode)}>
            <Tooltip.Root>
                <Tooltip.Trigger>
                    <ToggleGroup.Item value="grid" aria-label="Mode d'affichage en grille">
                        <Grid_3x3 class="size-4" />
                    </ToggleGroup.Item>
                </Tooltip.Trigger>
                <Tooltip.Content>
                    <p>Mode d'affichage en grille</p>
                </Tooltip.Content>
            </Tooltip.Root>
            <Tooltip.Root>
                <Tooltip.Trigger>
                    <ToggleGroup.Item value="list" aria-label="Mode d'affichage en grille">
                        <List class="size-4" />
                    </ToggleGroup.Item>
                </Tooltip.Trigger>
                <Tooltip.Content>
                    <p>Mode d'affichage en liste</p>
                </Tooltip.Content>
            </Tooltip.Root>
        </ToggleGroup.Root>
    </div>

    <!-- Games pages content -->
    {@render children?.()}
</div>

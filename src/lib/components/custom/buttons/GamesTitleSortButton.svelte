<script lang="ts">
    import { ArrowDownAz, ArrowUpAZ } from "@lucide/svelte";
    import { Button } from "../../ui/button";
    import { t } from "$src/lib/translations";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import { GamesStore } from "$src/lib/stores/games.svelte";
    import { global } from "$src/lib/states/global.svelte";

    const handleGameSortOrderChange = () => {
        global.gamesSortOrder = global.gamesSortOrder === "asc" ? "desc" : "asc";
        GamesStore.games = GamesStore.games.reverse();
        localStorage.setItem("gamesSortOrder", global.gamesSortOrder);
    };
</script>

<Tooltip.Provider delayDuration={100} disableHoverableContent>
    <Tooltip.Root>
        <Tooltip.Trigger>
            <Button variant="outline" class="border-l-0" onclick={handleGameSortOrderChange}>
                {#if global.gamesSortOrder === "asc"}
                    <ArrowDownAz />
                {:else}
                    <ArrowUpAZ />
                {/if}
            </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>
            <p>{$t("sort_order")}</p>
        </Tooltip.Content>
    </Tooltip.Root>
</Tooltip.Provider>

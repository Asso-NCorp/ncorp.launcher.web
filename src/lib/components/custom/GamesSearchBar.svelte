<script lang="ts">
    import { RefreshCw, Search, X, Clock } from "@lucide/svelte";
    import Input from "../ui/input/input.svelte";
    import { t } from "$src/lib/translations";
    import { GamesStore } from "$src/lib/states/games.svelte";
    import { global } from "$src/lib/states/global.svelte";
    import Button from "../ui/button/button.svelte";
    import GamesTitleSortButton from "./buttons/GamesTitleSortButton.svelte";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import { toast } from "svelte-sonner";
    import { goto } from "$app/navigation";
    import Card from "../ui/card/card.svelte";

    // Accept recentGames prop
    let { recentGames }: { recentGames?: Array<{ game_slug: string; lastPlayedTime: Date; totalPlayTime: number }> } =
        $props();

    // Store pour le terme de recherche

    const handleSearch = () => {
        GamesStore.search();
    };

    const handleRefreshGamesClick = async () => {
        const refreshed = await GamesStore.getAvailableGames();
        if (refreshed) {
            toast.success("Liste des jeux rafraîchie avec succès", { class: "bg-green-500" });
        }
    };

    // Format game slug to readable name
    function formatGameName(gameSlug: string): string {
        return gameSlug.replace(/[-_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    }

    // Handle recent game button click
    const handleRecentGameClick = async (gameSlug: string) => {
        await goto(`/games/${gameSlug}`);
    };
</script>

<div class="flex flex-col gap-2">
    <div class="flex">
        <Input
            bind:value={global.gamesSearchQuery}
            oninput={handleSearch}
            icon={Search}
            class="left-0 top-0 w-96 rounded-[var(--radius)]"
            placeholder="{$t('search_game')}..." />
        <Button
            variant="outline"
            class="border-l-0"
            disabled={!global.gamesSearchQuery || global.gamesSearchQuery === ""}
            onclick={GamesStore.clearSearch}>
            <X />
        </Button>
        <GamesTitleSortButton />

        <Tooltip.Root>
            <Tooltip.Trigger>
                <Button onclick={handleRefreshGamesClick} variant="outline" class="border-l-0">
                    <RefreshCw />
                </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>
                <p>Rafraîchir la liste des jeux</p>
            </Tooltip.Content>
        </Tooltip.Root>
        <!-- Recent games buttons -->
        {#if recentGames && recentGames.length > 0}
            <Card class="flex items-center gap-2 border-l-0">
                <div class="ml-2 flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock class="h-4 w-4" />
                    <span>Récemment joués:</span>
                </div>
                <div class="flex gap-1">
                    {#each recentGames as game}
                        <Tooltip.Root>
                            <Tooltip.Trigger>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    class="relative overflow-hidden text-xs"
                                    onclick={() => handleRecentGameClick(game.game_slug)}>
                                    <!-- Masked transparent game cover background -->
                                    <img
                                        src={GamesStore.getGameCover(game.game_slug)}
                                        alt="Cover for {formatGameName(game.game_slug)}"
                                        class="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-50 [mask-image:linear-gradient(to_right,transparent_0%,transparent_20%,black_100%)]" />
                                    <!-- Game name overlay -->
                                    <span class="relative z-10">{formatGameName(game.game_slug)}</span>
                                </Button>
                            </Tooltip.Trigger>
                            <Tooltip.Content>
                                <p>Dernière session: {new Date(game.lastPlayedTime).toLocaleDateString()}</p>
                            </Tooltip.Content>
                        </Tooltip.Root>
                    {/each}
                </div>
            </Card>
        {/if}
    </div>
</div>

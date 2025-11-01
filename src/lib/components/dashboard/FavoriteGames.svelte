<script lang="ts">
    import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { goto } from "$app/navigation";
    import { GamesStore } from "$lib/states/games.svelte";
    import { PUBLIC_MEDIAS_URL } from "$env/static/public";
    import dayjs from "dayjs";
    import duration from "dayjs/plugin/duration";
    import GameActionButton from "../custom/GameActionButton.svelte";

    dayjs.extend(duration);

    interface FavoriteGame {
        game_slug: string;
        totalPlayTime: number;
        sessionCount: number;
    }

    let { favoriteGames }: { favoriteGames: FavoriteGame[] } = $props();

    function formatDuration(totalSeconds: number | null): string {
        if (totalSeconds == null || totalSeconds < 1) return "0s";
        const d = dayjs.duration(totalSeconds, "seconds");
        const hours = d.hours();
        const minutes = d.minutes();
        const parts: string[] = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}min`);
        if (parts.length === 0) return "< 1min";
        return parts.join(" ");
    }

    function formatGameName(gameSlug: string): string {
        const game = GamesStore.get(gameSlug);
        if (game && game.title) return game.title;
        return gameSlug.replace(/[-_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    }
</script>

{#if favoriteGames.length > 0}
    <Card class="w-full">
        <CardHeader class="pb-2">
            <CardTitle class="flex items-center gap-2 text-lg">
                <iconify-icon icon="mdi:heart" class="text-red-500"></iconify-icon>
                Mes jeux favoris
            </CardTitle>
        </CardHeader>
        <CardContent class="flex w-full justify-center p-2">
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {#each favoriteGames as game}
                    {@const gameData = GamesStore.get(game.game_slug)}
                    <div
                        class="group border-muted hover:border-primary/50 relative aspect-video overflow-hidden rounded-lg border transition-all duration-200 hover:shadow-lg">
                        <!-- Background Image -->
                        {#if gameData}
                            <img
                                src={`${PUBLIC_MEDIAS_URL}/games/${game.game_slug}/poster_full.webp`}
                                alt={formatGameName(game.game_slug)}
                                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                        {:else}
                            <div class="bg-muted flex aspect-video items-center justify-center">
                                <iconify-icon icon="mdi:gamepad-variant" class="text-muted-foreground text-4xl">
                                </iconify-icon>
                            </div>
                        {/if}

                        <!-- Overlay -->
                        <div
                            class="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                            <div class="absolute inset-0 flex flex-col items-end justify-between p-2">
                                <GameActionButton {game} />

                                <div
                                    class="translate-y-8 space-y-0.5 text-white transition-transform duration-200 group-hover:translate-y-0">
                                    <h3 class="line-clamp-2 text-xs font-bold">{formatGameName(game.game_slug)}</h3>
                                    <p class="text-xs opacity-90">{formatDuration(game.totalPlayTime)}</p>
                                    <p class="text-xs opacity-75">{game.sessionCount} sessions</p>
                                </div>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </CardContent>
    </Card>
{/if}

<script lang="ts">
    import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { GamesStore } from "$lib/states/games.svelte";
    import dayjs from "dayjs";
    import duration from "dayjs/plugin/duration";
    import { goto } from "$app/navigation";
    import { PUBLIC_MEDIAS_URL } from "$env/static/public";
    import { fly } from "svelte/transition";

    dayjs.extend(duration);

    let { gameSessions }: { gameSessions: any[] } = $props();

    function formatDuration(totalSeconds: number | null): string {
        if (totalSeconds == null || totalSeconds < 1) return "0s";

        const d = dayjs.duration(totalSeconds, "seconds");
        const hours = d.hours();
        const minutes = d.minutes();
        const seconds = d.seconds();

        const parts: string[] = [];

        if (hours > 0) {
            parts.push(`${hours}h`);
        }
        if (minutes > 0) {
            parts.push(`${minutes}min`);
        }
        if (seconds > 0 && hours === 0) {
            parts.push(`${seconds}s`);
        }

        if (parts.length === 0) {
            if (totalSeconds > 0 && totalSeconds < 60) return `${Math.floor(totalSeconds)}s`;
            return "0s";
        }

        return parts.join(" ");
    }

    function formatGameName(gameSlug: string): string {
        const game = GamesStore.get(gameSlug);
        if (game && game.title) {
            return game.title;
        }
        return gameSlug;
    }

    function parseDateCorrectly(date: string | Date): dayjs.Dayjs {
        if (typeof date === "string") {
            const match = date.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
            if (match) {
                const [, year, month, day, hours, minutes, seconds] = match;
                const localDate = new Date(
                    parseInt(year, 10),
                    parseInt(month, 10) - 1,
                    parseInt(day, 10),
                    parseInt(hours, 10),
                    parseInt(minutes, 10),
                    parseInt(seconds, 10),
                );
                return dayjs(localDate);
            }
            return dayjs(date);
        } else {
            const offset = date.getTimezoneOffset() * 60000;
            const correctedDate = new Date(date.getTime() + offset);
            return dayjs(correctedDate);
        }
    }

    // Group games by day and cumulate playtime
    const groupedByDay = gameSessions.reduce(
        (acc, session) => {
            const date = parseDateCorrectly(session.start_time);
            const dayKey = date.format("YYYY-MM-DD");

            if (!acc[dayKey]) {
                acc[dayKey] = {
                    date: dayKey,
                    displayDate: date,
                    games: {},
                };
            }

            const gameSlug = session.game_slug;
            if (!acc[dayKey].games[gameSlug]) {
                acc[dayKey].games[gameSlug] = {
                    game_slug: gameSlug,
                    totalSeconds: 0,
                    sessionCount: 0,
                    lastSession: session.start_time,
                };
            }

            acc[dayKey].games[gameSlug].totalSeconds += session.total_seconds || 0;
            acc[dayKey].games[gameSlug].sessionCount += 1;
            // Keep track of the most recent session
            if (new Date(session.start_time) > new Date(acc[dayKey].games[gameSlug].lastSession)) {
                acc[dayKey].games[gameSlug].lastSession = session.start_time;
            }

            return acc;
        },
        {} as Record<
            string,
            {
                date: string;
                displayDate: dayjs.Dayjs;
                games: Record<
                    string,
                    {
                        game_slug: string;
                        totalSeconds: number;
                        sessionCount: number;
                        lastSession: string;
                    }
                >;
            }
        >,
    );

    // Sort days by date (most recent first) and get the 5 most recent days
    const sortedDays = Object.values(groupedByDay)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
</script>

<Card>
    <CardHeader class="pb-4">
        <CardTitle class="flex items-center gap-2">
            <iconify-icon icon="mdi:clock-outline" class="text-accent"></iconify-icon>
            5 derniers jeux joués
        </CardTitle>
    </CardHeader>
    <CardContent>
        {#if sortedDays.length > 0}
            <div class="space-y-4">
                {#each sortedDays as day, dayIndex}
                    <div class="space-y-2" in:fly={{ x: -20, duration: 300, delay: dayIndex * 100 }}>
                        <!-- Day Header -->
                        <div class="text-muted-foreground text-sm font-semibold">
                            {day.displayDate.format("dddd D MMMM YYYY")}
                        </div>

                        <!-- Games for this day -->
                        <div class="space-y-2 pl-2">
                            {#each Object.values(day.games) as game, gameIndex}
                                {@const gameInfo = GamesStore.get(game.game_slug)}
                                <div
                                    class="hover:border-primary/50 hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-3 transition-all duration-200 hover:shadow-sm"
                                    in:fly={{ x: -20, duration: 300, delay: dayIndex * 100 + gameIndex * 30 }}>
                                    <!-- Game Image -->
                                    {#if gameInfo}
                                        <img
                                            src={`${PUBLIC_MEDIAS_URL}/games/${game.game_slug}/poster_square.webp`}
                                            alt="Cover for {formatGameName(game.game_slug)}"
                                            class="h-10 w-10 rounded object-cover" />
                                    {:else}
                                        <div class="bg-muted flex h-10 w-10 items-center justify-center rounded">
                                            <iconify-icon icon="mdi:gamepad-variant" class="text-muted-foreground">
                                            </iconify-icon>
                                        </div>
                                    {/if}

                                    <!-- Game Info -->
                                    <div class="min-w-0 flex-1">
                                        <div class="w-full overflow-hidden">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onclick={async () => await goto(`/games/${game.game_slug}`)}
                                                class="h-auto p-0 font-medium hover:bg-transparent hover:underline truncate w-full justify-start">
                                                {formatGameName(game.game_slug)}
                                            </Button>
                                        </div>
                                        <div class="text-muted-foreground text-xs">
                                            {game.sessionCount} session{game.sessionCount > 1 ? "s" : ""}
                                        </div>
                                    </div>

                                    <!-- Total Duration -->
                                    <div class="shrink-0 text-right">
                                        <div class="text-success text-sm font-medium">
                                            {formatDuration(game.totalSeconds)}
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>
        {:else}
            <div class="flex flex-col items-center justify-center py-8 text-center">
                <div class="mb-2 text-4xl">🎮</div>
                <p class="text-muted-foreground text-sm">Aucun jeu joué pour le moment</p>
            </div>
        {/if}
    </CardContent>
</Card>

<script lang="ts">
    import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
    import * as Popover from "$lib/components/ui/popover";
    import dayjs from "dayjs";
    import weekOfYear from "dayjs/plugin/weekOfYear";

    dayjs.extend(weekOfYear);

    let { activityHeatmap, gameSessions }: { activityHeatmap: Record<string, number>; gameSessions: any[] } = $props();

    // Get the last 6 weeks of data
    const weeks = Array.from({ length: 6 }, (_, i) => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - i * 7);
        return startDate;
    })
        .reverse()
        .map((d) => ({
            weekStart: d,
            days: Array.from({ length: 7 }, (_, dayIndex) => {
                const date = new Date(d);
                date.setDate(date.getDate() + dayIndex);
                return date;
            }),
        }));

    function getActivityColor(count: number): string {
        if (count === 0) return "bg-muted";
        if (count === 1) return "bg-success/30";
        if (count === 2) return "bg-success/50";
        if (count === 3) return "bg-success/70";
        return "bg-success";
    }

    function getActivityCount(date: Date): number {
        const dateKey = date.toISOString().split("T")[0];
        return activityHeatmap[dateKey] || 0;
    }

    function getGamesSessions(date: Date): any[] {
        const dateKey = date.toISOString().split("T")[0];
        return gameSessions
            .filter((s) => new Date(s.start_time).toISOString().split("T")[0] === dateKey)
            .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
            .slice(0, 5)
            .map((s) => ({
                ...s,
                game: s.game,
            }));
    }

    function getWeekNumber(date: Date): number {
        return dayjs(date).week() as number;
    }
</script>

<Card>
    <CardHeader class="pb-4">
        <CardTitle class="flex items-center gap-2">
            <iconify-icon icon="mdi:calendar-heatmap" class="text-green-500"></iconify-icon>
            Votre activité (6 dernières semaines)
        </CardTitle>
    </CardHeader>
    <CardContent>
        <div class="overflow-x-auto">
            <div class="flex gap-2 pb-4 justify-center">
                {#each weeks as week, weekIndex}
                    <div class="flex flex-col gap-1 items-center">
                        <span class="text-xs text-muted-foreground font-medium">S{getWeekNumber(week.weekStart)}</span>
                        <div class="flex flex-col gap-1">
                            {#each week.days as day}
                            {@const count = getActivityCount(day)}
                            {@const games = getGamesSessions(day)}
                            {#if count === 0}
                                <div
                                    class={`border-border/50 h-5 w-5 rounded-sm border transition-all duration-200 hover:scale-125 hover:shadow-md ${getActivityColor(count)}`} />
                            {:else}
                                <Popover.Root>
                                    <Popover.Trigger>
                                        <div
                                            class={`border-border/50 h-5 w-5 rounded-sm border transition-all duration-200 hover:scale-125 hover:shadow-md cursor-pointer ${getActivityColor(count)}`} />
                                    </Popover.Trigger>
                                    <Popover.Content class="w-80 p-4">
                                        <div class="space-y-3">
                                            <div>
                                                <p class="font-semibold text-sm">{dayjs(day).format("dddd DD MMMM YYYY")}</p>
                                                <p class="text-xs text-muted-foreground">{count} session{count > 1 ? "s" : ""}</p>
                                            </div>
                                            {#if games.length > 0}
                                                <div class="space-y-2">
                                                    <p class="text-xs font-medium">5 derniers jeux:</p>
                                                    <div class="space-y-1">
                                                        {#each games as game}
                                                            <div class="flex items-center gap-2 text-xs p-2 rounded bg-secondary">
                                                                {#if game.game?.image}
                                                                    <img src={game.game.image} alt={game.game?.name} class="h-6 w-6 rounded object-cover" />
                                                                {/if}
                                                                <div class="flex-1 min-w-0">
                                                                    <p class="font-medium truncate">{game.game?.name || "Jeu inconnu"}</p>
                                                                    <p class="text-muted-foreground text-xs">{dayjs(game.start_time).format("HH:mm")}</p>
                                                                </div>
                                                            </div>
                                                        {/each}
                                                    </div>
                                                </div>
                                            {/if}
                                        </div>
                                    </Popover.Content>
                                </Popover.Root>
                            {/if}
                        {/each}
                        </div>
                    </div>
                {/each}
            </div>
        </div>

        <!-- Legend -->
        <div class="mt-4 flex items-center justify-center gap-3 text-xs">
            <span class="text-muted-foreground">Moins</span>
            <div class="flex gap-1">
                <div class="bg-muted border-border/50 h-3 w-3 rounded-sm border"></div>
                <div class="bg-success/30 border-border/50 h-3 w-3 rounded-sm border"></div>
                <div class="bg-success/50 border-border/50 h-3 w-3 rounded-sm border"></div>
                <div class="bg-success/70 border-border/50 h-3 w-3 rounded-sm border"></div>
                <div class="bg-success border-border/50 h-3 w-3 rounded-sm border"></div>
            </div>
            <span class="text-muted-foreground">Plus</span>
        </div>
    </CardContent>
</Card>

<script lang="ts">
    import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import dayjs from "dayjs";

    let { activityHeatmap }: { activityHeatmap: Record<string, number> } = $props();

    // Get the last 12 weeks of data
    const weeks = Array.from({ length: 12 }, (_, i) => {
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

    function formatTooltip(date: Date, count: number): string {
        const dayName = dayjs(date).format("dddd");
        const dateStr = dayjs(date).format("DD MMMM YYYY");
        return `${dayName} ${dateStr}: ${count} sessions`;
    }
</script>

<Card>
    <CardHeader class="pb-4">
        <CardTitle class="flex items-center gap-2">
            <iconify-icon icon="mdi:calendar-heatmap" class="text-green-500"></iconify-icon>
            Votre activité (12 dernières semaines)
        </CardTitle>
    </CardHeader>
    <CardContent>
        <div class="overflow-x-auto">
            <div class="flex gap-2 pb-4">
                {#each weeks as week}
                    <div class="flex flex-col gap-1">
                        {#each week.days as day}
                            {@const count = getActivityCount(day)}
                            <Tooltip.Root>
                                <Tooltip.Trigger>
                                    <div
                                        class={`border-border/50 h-3 w-3 rounded-sm border transition-all duration-200 hover:scale-125 hover:shadow-md ${getActivityColor(count)}`} />
                                </Tooltip.Trigger>
                                <Tooltip.Content>
                                    <p class="text-sm">{formatTooltip(day, count)}</p>
                                </Tooltip.Content>
                            </Tooltip.Root>
                        {/each}
                    </div>
                {/each}
            </div>
        </div>

        <!-- Legend -->
        <div class="mt-4 flex items-center justify-center gap-3 text-xs">
            <span class="text-muted-foreground">Moins</span>
            <div class="flex gap-1">
                <div class="bg-muted border-border/50 h-2 w-2 rounded-sm border"></div>
                <div class="bg-success/30 border-border/50 h-2 w-2 rounded-sm border"></div>
                <div class="bg-success/50 border-border/50 h-2 w-2 rounded-sm border"></div>
                <div class="bg-success/70 border-border/50 h-2 w-2 rounded-sm border"></div>
                <div class="bg-success border-border/50 h-2 w-2 rounded-sm border"></div>
            </div>
            <span class="text-muted-foreground">Plus</span>
        </div>
    </CardContent>
</Card>

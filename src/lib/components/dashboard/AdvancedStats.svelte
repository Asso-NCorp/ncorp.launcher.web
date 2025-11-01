<script lang="ts">
    import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
    import { Separator } from "$lib/components/ui/separator";
    import * as Tooltip from "$lib/components/ui/tooltip";

    interface StreakData {
        current: number;
        longest: number;
    }

    interface PeakHour {
        hour: number;
        sessions: number;
        minutes: string;
    }

    let { streak, peakHours }: { streak: StreakData; peakHours: PeakHour[] } = $props();

    function formatHour(hour: number): string {
        return `${hour.toString().padStart(2, "0")}:00`;
    }
</script>

<Card>
    <CardHeader class="pb-4">
        <CardTitle class="flex items-center gap-2">
            <iconify-icon icon="mdi:lightning-bolt" class="text-orange-500"></iconify-icon>
            Statistiques avancées
        </CardTitle>
    </CardHeader>
    <CardContent>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <!-- Streak Section -->
            <div class="space-y-3">
                <h3 class="text-muted-foreground text-sm font-semibold">Votre Streak</h3>
                <div class="grid grid-cols-2 gap-3">
                    <Tooltip.Root>
                        <Tooltip.Trigger>
                            <div class="border-primary/20 bg-primary/5 rounded-lg border p-3 text-center">
                                <div class="text-primary text-2xl font-bold">
                                    {streak.current}
                                </div>
                                <p class="text-muted-foreground mt-1 text-xs">Jours consécutifs</p>
                            </div>
                        </Tooltip.Trigger>
                        <Tooltip.Content>
                            <p>Jours d'affilée où vous avez joué</p>
                        </Tooltip.Content>
                    </Tooltip.Root>

                    <Tooltip.Root>
                        <Tooltip.Trigger>
                            <div class="border-accent/20 bg-accent/5 rounded-lg border p-3 text-center">
                                <div class="text-accent text-2xl font-bold">
                                    {streak.longest}
                                </div>
                                <p class="text-muted-foreground mt-1 text-xs">Meilleur streak</p>
                            </div>
                        </Tooltip.Trigger>
                        <Tooltip.Content>
                            <p>Votre meilleur streak enregistré</p>
                        </Tooltip.Content>
                    </Tooltip.Root>
                </div>
            </div>

            <!-- Peak Hours Section -->
            {#if peakHours.length > 0}
                <div class="space-y-3">
                    <h3 class="text-muted-foreground text-sm font-semibold">Heures de pointe</h3>
                    <div class="space-y-2">
                        {#each peakHours as peak}
                            <div class="bg-muted/30 flex items-center justify-between rounded-lg border p-2">
                                <div class="flex items-center gap-2">
                                    <span class="text-sm font-medium">{formatHour(peak.hour)}</span>
                                    <span class="text-muted-foreground text-xs">{peak.sessions} sessions</span>
                                </div>
                                <span class="text-success text-xs font-semibold">{peak.minutes}</span>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
    </CardContent>
</Card>

<script lang="ts">
    import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
    import { Separator } from "$lib/components/ui/separator";
    import AvatarDiscord from "$lib/components/custom/AvatarDiscord.svelte";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import dayjs from "dayjs";
    import duration from "dayjs/plugin/duration";

    dayjs.extend(duration);

    interface LeaderboardUser {
        id: string;
        name: string;
        displayUsername: string | null;
        image: string | null;
        totalPlayTime: number;
        isCurrentUser: boolean;
    }

    let {
        leaderboardData,
        currentUserId,
        rank,
    }: { leaderboardData: LeaderboardUser[]; currentUserId: string; rank: number } = $props();

    function formatDuration(totalSeconds: number): string {
        if (totalSeconds == null || totalSeconds < 1) return "0h";
        const d = dayjs.duration(totalSeconds, "seconds");
        const hours = d.asHours();
        return `${Math.round(hours)}h`;
    }

    function getMedalEmoji(position: number): string {
        switch (position) {
            case 0:
                return "🥇";
            case 1:
                return "🥈";
            case 2:
                return "🥉";
            default:
                return `#${position + 1}`;
        }
    }

    function getRankColor(position: number): string {
        switch (position) {
            case 0:
                return "text-yellow-500";
            case 1:
                return "text-gray-400";
            case 2:
                return "text-amber-600";
            default:
                return "text-muted-foreground";
        }
    }
</script>

<Card>
    <CardHeader class="pb-4">
        <CardTitle class="flex items-center gap-2">
            <iconify-icon icon="mdi:podium" class="text-purple-500"></iconify-icon>
            Classement du mois
        </CardTitle>
    </CardHeader>
    <CardContent>
        <div class="space-y-1">
            {#each leaderboardData as user, position}
                {@const isHighlighted = user.isCurrentUser}
                <div
                    class={`flex items-center justify-between gap-4 rounded-lg p-3 transition-all duration-200 ${
                        isHighlighted
                            ? "bg-primary/10 border-primary/30 border"
                            : "hover:bg-muted/50 border border-transparent"
                    }`}>
                    <div class="flex min-w-0 flex-1 items-center gap-3">
                        <div class={`min-w-fit text-lg font-bold ${getRankColor(position)}`}>
                            {getMedalEmoji(position)}
                        </div>
                        <div class="min-w-0 flex-1">
                            <AvatarDiscord size={32} name={user.name} src={`/api/avatars/${user.id}`} alt={user.name} />
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="truncate text-sm font-medium">
                                {user.displayUsername || user.name}
                                {#if isHighlighted}
                                    <span class="text-primary ml-2 text-xs font-semibold">(Vous)</span>
                                {/if}
                            </p>
                        </div>
                    </div>
                    <Tooltip.Root>
                        <Tooltip.Trigger>
                            <span class="text-success min-w-fit text-sm font-bold">
                                {formatDuration(user.totalPlayTime)}
                            </span>
                        </Tooltip.Trigger>
                        <Tooltip.Content>
                            <p>Temps de jeu du mois</p>
                        </Tooltip.Content>
                    </Tooltip.Root>
                </div>
                {#if position < leaderboardData.length - 1}
                    <Separator class="my-1" />
                {/if}
            {/each}

            {#if rank > 0}
                <div class="mt-4 border-t pt-4 text-center">
                    <p class="text-muted-foreground text-sm">
                        Vous êtes classé <span class="text-primary font-bold">#{rank}</span>
                         ce mois-ci
                    </p>
                </div>
            {/if}
        </div>
    </CardContent>
</Card>

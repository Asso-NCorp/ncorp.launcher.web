<script lang="ts">
    import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
    import { Separator } from "$lib/components/ui/separator";
    import { Button } from "$lib/components/ui/button";
    import AvatarDiscord from "$lib/components/custom/AvatarDiscord.svelte";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import dayjs from "dayjs";
    import duration from "dayjs/plugin/duration";
    import "dayjs/locale/fr";

    dayjs.extend(duration);
    dayjs.locale("fr");

    interface LeaderboardUser {
        id: string;
        name: string;
        displayUsername: string | null;
        image: string | null;
        totalPlayTime: number;
        isCurrentUser: boolean;
        decoration?: string | null;
    }

    interface GameSession {
        id: string;
        user_id: string;
        game_slug: string;
        start_time: Date | string;
        end_time: Date | string | null;
        total_seconds: number | null;
        user: {
            id: string;
            name: string;
            displayUsername: string | null;
            image: string | null;
        };
    }

    let {
        leaderboardData,
        currentUserId,
        rank,
        allSessions = [],
        roles = [],
    }: { leaderboardData: LeaderboardUser[]; currentUserId: string; rank: number; allSessions?: GameSession[]; roles?: any[] } = $props();

    let selectedMonth = $state(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1));
    let computedLeaderboard = $state(leaderboardData);
    let computedRank = $state(rank);

    function calculateLeaderboardForMonth(sessions: GameSession[], targetDate: Date, userId: string) {
        const firstDayOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const firstDayOfNextMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1);

        // Create a map of role names to role objects for quick lookup
        const roleMap = new Map(roles.map((r) => [r.name, r]));

        // Filter sessions from the target month that have end_time
        const monthSessions = sessions.filter((s) => {
            const startTime = new Date(s.start_time);
            return startTime >= firstDayOfMonth && startTime < firstDayOfNextMonth && s.end_time;
        });

        // Group by user and sum playtime in seconds
        const userStats = new Map<string, { totalSeconds: number; sessionCount: number; userInfo: any }>();

        monthSessions.forEach((session) => {
            const userId = session.user_id;
            const startTime = new Date(session.start_time).getTime();
            const endTime = new Date(session.end_time!).getTime();
            const sessionSeconds = Math.max(0, (endTime - startTime) / 1000);

            const current = userStats.get(userId) || { totalSeconds: 0, sessionCount: 0, userInfo: session.user };
            current.totalSeconds += sessionSeconds;
            current.sessionCount += 1;
            userStats.set(userId, current);
        });

        // Convert to leaderboard format
        const leaderboard = Array.from(userStats.entries())
            .map(([userId, stats]) => {
                const userRole = roleMap.get(stats.userInfo?.role);
                return {
                    id: userId,
                    name: stats.userInfo?.name || "Utilisateur",
                    displayUsername: stats.userInfo?.displayUsername,
                    image: stats.userInfo?.image,
                    totalPlayTime: stats.totalSeconds,
                    sessionCount: stats.sessionCount,
                    isCurrentUser: userId === currentUserId,
                    decoration: userRole?.avatar_decoration_static || userRole?.avatar_decoration_animated,
                };
            })
            .sort((a, b) => b.totalPlayTime - a.totalPlayTime)
            .slice(0, 10);

        const userRank = leaderboard.findIndex((u) => u.isCurrentUser) + 1;
        return { leaderboard, userRank };
    }

    function onMonthChange(direction: number) {
        console.log("onMonthChange called with direction:", direction);
        console.log("allSessions length:", allSessions.length);
        selectedMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + direction, 1);
        const { leaderboard, userRank } = calculateLeaderboardForMonth(allSessions, selectedMonth, currentUserId);
        computedLeaderboard = leaderboard;
        computedRank = userRank;
        console.log("Updated leaderboard:", computedLeaderboard);
    }

    // Initialize with previous month's data
    $effect.pre(() => {
        if (allSessions.length > 0) {
            const { leaderboard, userRank } = calculateLeaderboardForMonth(allSessions, selectedMonth, currentUserId);
            computedLeaderboard = leaderboard;
            computedRank = userRank;
        }
    });

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
        <div class="flex items-center justify-between gap-2">
            <CardTitle class="flex items-center gap-2">
                <iconify-icon icon="mdi:podium" class="text-purple-500"></iconify-icon>
                Classement du mois
            </CardTitle>
            <div class="flex items-center gap-2">
                <Button
                    onclick={() => onMonthChange(-1)}
                    variant="ghost"
                    size="icon"
                    title="Mois précédent">
                    ◀
                </Button>
                <span class="min-w-40 text-center text-sm font-medium">
                    {selectedMonth.toLocaleString("fr-FR", { month: "long", year: "numeric" })}
                </span>
                <Button
                    onclick={() => onMonthChange(1)}
                    variant="ghost"
                    size="icon"
                    title="Mois suivant">
                    ▶
                </Button>
            </div>
        </div>
    </CardHeader>
    <CardContent>
        <div class="space-y-1">
            {#each computedLeaderboard as user, position}
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
                        <AvatarDiscord 
                            size={32} 
                            name={user.displayUsername || user.name} 
                            src={`/api/avatars/${user.id}`} 
                            alt={user.displayUsername || user.name}
                            decorationSrc={user.decoration || undefined} 
                        />
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
                {#if position < computedLeaderboard.length - 1}
                    <Separator class="my-1" />
                {/if}
            {/each}

            {#if computedRank > 0}
                <div class="mt-4 border-t pt-4 text-center">
                    <p class="text-muted-foreground text-sm">
                        Vous êtes classé <span class="text-primary font-bold">#{computedRank}</span>
                         ce mois-ci
                    </p>
                </div>
            {/if}
        </div>
    </CardContent>
</Card>

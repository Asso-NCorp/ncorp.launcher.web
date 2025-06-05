<script lang="ts">
    import type { PageData } from "./$types";
    import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
    import { Avatar, AvatarFallback, AvatarImage } from "$lib/components/ui/avatar";
    import { Badge } from "$lib/components/ui/badge";
    import { Separator } from "$lib/components/ui/separator";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import { GamesStore } from "$lib/stores/games.svelte";
    import dayjs from "dayjs";
    import duration from "dayjs/plugin/duration";
    import relativeTime from "dayjs/plugin/relativeTime";
    import localizedFormat from "dayjs/plugin/localizedFormat";
    import customParseFormat from "dayjs/plugin/customParseFormat";
    import "dayjs/locale/fr";
    import { goto } from "$app/navigation";
    import { Button } from "$src/lib/components/ui/button";

    // Configure dayjs
    dayjs.extend(duration);
    dayjs.extend(relativeTime);
    dayjs.extend(localizedFormat);
    dayjs.extend(customParseFormat);
    dayjs.locale("fr");

    let { data }: { data: PageData } = $props();

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

    // Helper function to parse date strings or correct Date objects for timezone issues
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
            // Correct for timezone misinterpretation on Date objects
            const offset = date.getTimezoneOffset() * 60000;
            const correctedDate = new Date(date.getTime() + offset);
            return dayjs(correctedDate);
        }
    }

    function formatRelativeTime(date: string | Date): string {
        return parseDateCorrectly(date).fromNow();
    }

    function formatAbsoluteTime(date: string | Date): string {
        return parseDateCorrectly(date).format("dddd D MMMM YYYY [à] HH:mm");
    }

    function formatGameName(gameSlug: string): string {
        const game = GamesStore.get(gameSlug);
        if (game && game.title) {
            return game.title;
        }
        return gameSlug.replace(/[-_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    }

    function getUserDisplayName(user: any): string {
        if (!user) {
            return "Utilisateur inconnu";
        }
        return user.name || user.displayName || "Utilisateur inconnu";
    }
</script>

<div class="container mx-auto space-y-6 p-6">
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-3xl font-bold">Tableau de bord</h1>
            <p class="text-muted-foreground">Activités récentes de la communauté</p>
        </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
        <!-- Statistiques personnelles -->
        {#if data.gameSessions && data.gameSessions.length > 0}
            {@const relevantSessions = data.gameSessions.filter((s: any) => s.total_seconds && s.total_seconds > 0)}

            {#if relevantSessions.length > 0}
                {@const totalPlayTime = relevantSessions.reduce(
                    (sum: number, session: any) => sum + (session.total_seconds || 0),
                    0,
                )}
                {@const uniqueGames = new Set(relevantSessions.map((s: any) => s.game_slug)).size}
                {@const sessionsThisWeek = relevantSessions.filter((s: any) => {
                    const sessionDate = parseDateCorrectly(s.start_time);
                    const weekAgo = dayjs().subtract(7, "days");
                    return sessionDate.isAfter(weekAgo);
                }).length}

                <Card>
                    <CardHeader class="pb-2">
                        <CardTitle class="text-sm font-medium">Temps de jeu total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold text-primary">{formatDuration(totalPlayTime)}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader class="pb-2">
                        <CardTitle class="text-sm font-medium">Jeux joués</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold text-accent">{uniqueGames}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader class="pb-2">
                        <CardTitle class="text-sm font-medium">Sessions cette semaine</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold text-info">{sessionsThisWeek}</div>
                    </CardContent>
                </Card>
            {/if}
        {/if}
    </div>

    <!-- Activités récentes -->
    <Card>
        <CardHeader class="px-0 pb-6">
            <CardTitle class="flex items-center gap-2">
                <iconify-icon icon="mdi:gamepad-variant" class="text-primary"></iconify-icon>
                Activités récentes
            </CardTitle>
        </CardHeader>
        <CardContent class="p-0">
            {#if data.allActivities && data.allActivities.length > 0}
                <div class="space-y-1">
                    {#each data.allActivities as activity, index}
                        {@const game = GamesStore.get(activity.game_slug)}
                        <div
                            class="relative flex items-center gap-4 overflow-hidden p-4 pl-40 transition-colors hover:bg-muted/50">
                            <Avatar class="h-10 w-10">
                                <AvatarImage
                                    src={`/api/avatars/${activity.user.id}`}
                                    alt={getUserDisplayName(activity.user)} />
                                <AvatarFallback class="bg-primary/20 text-primary">
                                    {getUserDisplayName(activity.user).charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div class="z-10 flex-1 space-y-1">
                                <div class="flex items-center gap-2">
                                    <span class="font-medium">
                                        {#if activity.isCurrentUser}
                                            Vous avez joué à
                                        {:else}
                                            {getUserDisplayName(activity.user)} a joué à
                                        {/if}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onclick={async () => await goto(`/games/${activity.game_slug}`)}
                                        class="gap-1">
                                        {formatGameName(activity.game_slug)}
                                    </Button>
                                </div>
                                <div class="flex items-center gap-4 text-sm text-muted-foreground">
                                    <Tooltip.Root>
                                        <Tooltip.Trigger>
                                            <span>{formatRelativeTime(activity.lastPlayedTime)}</span>
                                        </Tooltip.Trigger>
                                        <Tooltip.Content>
                                            <p>{formatAbsoluteTime(activity.lastPlayedTime)}</p>
                                        </Tooltip.Content>
                                    </Tooltip.Root>
                                    <span>•</span>
                                    <span class="font-medium text-success">
                                        {formatDuration(activity.totalPlayTime)}
                                    </span>
                                </div>
                            </div>
                            <div class="z-10 text-xs text-muted-foreground">
                                {parseDateCorrectly(activity.lastPlayedTime).format("D MMM HH:mm")}
                            </div>

                            {#if game}
                                <img
                                    src={GamesStore.getGameCover(activity.game_slug)}
                                    alt="Cover for {formatGameName(activity.game_slug)}"
                                    class="pointer-events-none absolute inset-y-0 left-0 h-full w-40 object-cover opacity-20"
                                    style="mask-image: linear-gradient(to left, transparent 5%, black 10%); -webkit-mask-image: linear-gradient(to left, transparent 5%, black 50%);" />
                            {/if}
                        </div>

                        {#if index < data.allActivities.length - 1}
                            <Separator />
                        {/if}
                    {/each}
                </div>
            {:else}
                <div class="flex flex-col items-center justify-center py-12 text-center">
                    <div class="mb-4 text-6xl">🎮</div>
                    <h3 class="mb-2 text-lg font-medium">Aucune activité pour le moment</h3>
                    <p class="text-muted-foreground">Commencez à jouer pour voir vos activités ici !</p>
                </div>
            {/if}
        </CardContent>
    </Card>
</div>

<script lang="ts">
    import type { PageData } from "./$types";
    import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
    import { Separator } from "$lib/components/ui/separator";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import { GamesStore } from "$lib/states/games.svelte";
    import AvatarDiscord from "$lib/components/custom/AvatarDiscord.svelte";
    import dayjs from "dayjs";
    import duration from "dayjs/plugin/duration";
    import relativeTime from "dayjs/plugin/relativeTime";
    import localizedFormat from "dayjs/plugin/localizedFormat";
    import customParseFormat from "dayjs/plugin/customParseFormat";
    import "dayjs/locale/fr";
    import { goto } from "$app/navigation";
    import { Button } from "$src/lib/components/ui/button";
    import { fly } from "svelte/transition";
    import type { role } from "@prisma/client";
    import { PUBLIC_MEDIAS_URL } from "$env/static/public";
    import Achievements from "$lib/components/dashboard/Achievements.svelte";
    import AdvancedStats from "$lib/components/dashboard/AdvancedStats.svelte";
    import FavoriteGames from "$lib/components/dashboard/FavoriteGames.svelte";
    import ActivityHeatmap from "$lib/components/dashboard/ActivityHeatmap.svelte";
    import Leaderboard from "$lib/components/dashboard/Leaderboard.svelte";
    import OnlineFriends from "$lib/components/dashboard/OnlineFriends.svelte";
    import RecentGames from "$lib/components/dashboard/RecentGames.svelte";
    import { Gamepad2 } from "@lucide/svelte";

    // Configure dayjs
    dayjs.extend(duration);
    dayjs.extend(relativeTime);
    dayjs.extend(localizedFormat);
    dayjs.extend(customParseFormat);
    dayjs.locale("fr");

    let { data }: { data: PageData } = $props();

    var roles = (data["roles"] as role[]) || [];

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

    function getAvatarDecoration(userRole: string | null | undefined) {
        if (!userRole) return undefined;
        const role_obj = roles.find((r) => r.name === userRole);
        if (!role_obj) return undefined;
        return role_obj.avatar_decoration_static || role_obj.avatar_decoration_animated || undefined;
    }
</script>

<div class="mx-auto space-y-6 p-6">
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-3xl font-bold">Tableau de bord</h1>
            <p class="text-muted-foreground">Activités récentes de la communauté</p>
        </div>
    </div>

    <!-- Statistiques personnelles -->
    <div class="grid gap-6 lg:grid-cols-3">
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

    <!-- Mes jeux favoris -->
    <!-- <FavoriteGames favoriteGames={data.favoriteGames} /> -->

    

    <!-- Statistiques avancées -->
    <!-- <AdvancedStats streak={data.streak} peakHours={data.peakHours} /> -->

    <div class="grid grid-cols-2 xl:grid-cols-3 gap-6">
        <!-- Colonne gauche: Achievements et ActivityHeatmap empilés -->
        <div class="col-span-1 flex flex-col gap-6 min-h-0">
            <!-- Succès et badges -->
            <div class="shrink-0">
                <Achievements achievements={data.achievements} />
            </div>

            <!-- Calendrier d'activité -->
            <div class="flex-1 min-h-0 overflow-y-auto">
                <ActivityHeatmap activityHeatmap={data.activityHeatmap} gameSessions={data.gameSessions} />
            </div>
        </div>

        <!-- Colonne centrale: RecentGames avec hauteur limitée -->
        <div class="col-span-1 overflow-y-auto min-h-0 h-165">
            <RecentGames gameSessions={data.gameSessions} />
        </div>

        <!-- Colonne droite: Leaderboard mensuel (hidden sur petits écrans) -->
        {#if data.leaderboardData && data.leaderboardData.length > 0}
            <div class="hidden lg:block h-165 overflow-y-auto">
                <Leaderboard leaderboardData={data.leaderboardData} currentUserId={data.user?.id} rank={data.userRank} allSessions={data.allSessions} roles={data.roles} />
            </div>
        {/if}
    </div>

    <!-- Jeux tendance -->
    {#if data.trendingGames && data.trendingGames.length > 0}
        <Card>
            <CardHeader class="pb-4">
                <CardTitle class="flex items-center gap-2">
                    <iconify-icon icon="mdi:trending-up" class="text-primary"></iconify-icon>
                    Jeux tendance cette semaine
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div class="space-y-3">
                    {#each data.trendingGames as trendingGame, index}
                        {@const game = GamesStore.get(trendingGame.game_slug)}
                        <div
                            class="group relative flex items-center gap-4 rounded-lg border p-3 transition-all duration-200 hover:border-primary/50 hover:bg-muted/50 hover:shadow-sm"
                            in:fly={{ x: -20, duration: 300, delay: index * 100 }}>
                            <!-- Rank badge with gradient for top 3 -->
                            <div
                                class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-transform duration-200 group-hover:scale-110
                                {index === 0
                                    ? 'bg-linear-to-r from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-400/25'
                                    : index === 1
                                      ? 'bg-linear-to-r from-gray-300 to-gray-500 text-white shadow-lg shadow-gray-400/25'
                                      : index === 2
                                        ? 'bg-linear-to-r from-amber-600 to-amber-800 text-white shadow-lg shadow-amber-600/25'
                                        : 'bg-primary/10 text-primary'}">
                                {index + 1}
                            </div>

                            {#if game}
                                <img
                                    src={`${PUBLIC_MEDIAS_URL}/games/${trendingGame.game_slug}/poster_square.webp`}
                                    alt="Cover for {formatGameName(trendingGame.game_slug)}"
                                    class="h-12 w-12 rounded object-cover" />
                            {:else}
                                <div class="flex h-12 w-12 items-center justify-center rounded bg-muted">
                                    <Gamepad2 class="text-muted-foreground" />
                                </div>
                            {/if}
                            <div class="flex-1">
                                <div class="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onclick={async () => await goto(`/games/${trendingGame.game_slug}`)}
                                        class="h-auto p-0 font-medium hover:bg-transparent hover:underline">
                                        {formatGameName(trendingGame.game_slug)}
                                    </Button>
                                </div>
                                <div class="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>
                                        {trendingGame.uniquePlayers} joueur{trendingGame.uniquePlayers > 1 ? "s" : ""}
                                    </span>
                                    <span>•</span>
                                    <span>{formatDuration(trendingGame.totalPlayTime)} total</span>
                                    <span>•</span>
                                    <span>
                                        {trendingGame.sessionCount} session{trendingGame.sessionCount > 1 ? "s" : ""}
                                    </span>
                                </div>
                                <!-- Player Avatars -->
                                {#if trendingGame.players && trendingGame.players.length > 0}
                                    {@const visiblePlayers = trendingGame.players.slice(0, 4)}
                                    {@const remainingPlayers = trendingGame.players.slice(4)}
                                    <div class="mt-2 flex items-center">
                                        <span class="mr-2 text-xs text-muted-foreground">Joueurs:</span>
                                        <div class="flex items-center">
                                            {#each visiblePlayers as player, playerIndex}
                                                <Tooltip.Root>
                                                    <Tooltip.Trigger>
                                                        <div
                                                            style="z-index: {10 - playerIndex}; margin-left: {playerIndex > 0 ? '-4px' : '0'}"
                                                            class="transition-all duration-200 hover:scale-110">
                                                            <AvatarDiscord
                                                                size={24}
                                                                name={player.name}
                                                                src={player.image!}
                                                                alt={player.name}
                                                                decorationSrc={getAvatarDecoration(player.role)} />
                                                        </div>
                                                    </Tooltip.Trigger>
                                                    <Tooltip.Content>
                                                        <p>{player.displayUsername || player.name}</p>
                                                    </Tooltip.Content>
                                                </Tooltip.Root>
                                            {/each}

                                            {#if remainingPlayers.length > 0}
                                                <Tooltip.Root>
                                                    <Tooltip.Trigger>
                                                        <div
                                                            class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-primary/20 hover:text-primary"
                                                            style="margin-left: {visiblePlayers.length > 0
                                                                ? '-4px'
                                                                : '0'}; z-index: 5">
                                                            +{remainingPlayers.length}
                                                        </div>
                                                    </Tooltip.Trigger>
                                                    <Tooltip.Content>
                                                        <div class="max-w-48 space-y-1">
                                                            <p class="font-medium">
                                                                et {remainingPlayers.length} autre{remainingPlayers.length >
                                                                1
                                                                    ? "s"
                                                                    : ""} :
                                                            </p>
                                                            {#each remainingPlayers as player}
                                                                <p class="text-sm">
                                                                    {player.displayUsername || player.name}
                                                                </p>
                                                            {/each}
                                                        </div>
                                                    </Tooltip.Content>
                                                </Tooltip.Root>
                                            {/if}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                            <!-- <Badge variant="secondary" class="shrink-0">
                                🔥 {trendingGame.trendingScore}
                            </Badge> -->
                        </div>
                    {/each}
                </div>
            </CardContent>
        </Card>
    {/if}

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
                            <div class="relative">
                                <AvatarDiscord
                                    size={40}
                                    name={activity.user.name}
                                    src={`/api/avatars/${activity.user.id}`}
                                    alt={activity.user.name}
                                    decorationSrc={getAvatarDecoration(activity.user.role)} />
                            </div>

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
                                            <span>{formatRelativeTime(activity.start_time)}</span>
                                        </Tooltip.Trigger>
                                        <Tooltip.Content>
                                            <p>{formatAbsoluteTime(activity.start_time)}</p>
                                        </Tooltip.Content>
                                    </Tooltip.Root>
                                    <span>•</span>
                                    <span class="font-medium text-success">
                                        {formatDuration(activity.total_seconds)}
                                    </span>
                                    {#if activity.end_time}
                                        <span>•</span>
                                        <span class="text-xs">
                                            {parseDateCorrectly(activity.start_time).format("HH:mm")} - {parseDateCorrectly(
                                                activity.end_time,
                                            ).format("HH:mm")}
                                        </span>
                                    {/if}
                                </div>
                            </div>
                            <div class="z-10 text-xs text-muted-foreground">
                                {parseDateCorrectly(activity.start_time).format("D MMM HH:mm")}
                            </div>

                            {#if game}
                                <img
                                    src={`${PUBLIC_MEDIAS_URL}/games/${game.folderSlug}/poster_small.webp`}
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

<script lang="ts">
    import { MemoryStick, Radio, TimerIcon } from "@lucide/svelte";
    import { PUBLIC_MEDIAS_URL } from "$env/static/public";
    import { goto } from "$app/navigation";
    import { getGameResourceUrl } from "$lib/utils";
    import dayjs from "dayjs";
    import duration from "dayjs/plugin/duration";
    import type { InstallableGameExtended } from "$lib/types";
    import { GamesStore } from "$src/lib/states/games.svelte";
    import { liveUsers } from "$src/lib/states/live-users.svelte";
    import type { DetectedServer } from "$src/lib/shared-models";
    import * as Tooltip from "$src/lib/components/ui/tooltip";
    import AvatarDiscord from "$src/lib/components/custom/AvatarDiscord.svelte";
    import type { role } from "@prisma/client";

    dayjs.extend(duration);

    let {
        server,
        game,
        disabled = false,
        roles = [],
    }: { server: DetectedServer; game: InstallableGameExtended; disabled?: boolean; roles?: role[] } = $props();

    let serverPlayers = $derived(GamesStore.findServerPlayers(server.gameSlug!));

    function getAvatarDecoration(userRole: string | null | undefined) {
        if (!userRole) return undefined;
        const role_obj = roles.find((r) => r.name === userRole);
        if (!role_obj) return undefined;
        return role_obj.avatar_decoration_static || role_obj.avatar_decoration_animated || undefined;
    }

    // Match server players with live users store
    let enrichedPlayers = $derived.by(() => {
        if (!serverPlayers?.players) return [];
        
        return serverPlayers.players.map((player) => {
            const liveUser = liveUsers.users.find((u) => 
                u.name?.toLowerCase() === player.name?.toLowerCase() ||
                u.displayName?.toLowerCase() === player.name?.toLowerCase()
            );
            
            return {
                ...player,
                liveUser: liveUser,
                displayName: liveUser?.displayName || player.displayUsername || player.name,
                image: liveUser?.image || player.image,
                role: liveUser?.role,
                avatarDecoration: getAvatarDecoration(liveUser?.role),
            };
        });
    });

    function formatUptime(uptimeString: string): string {
        // Parse uptime string format "2.10:09:10.2090502" (days.hours:minutes:seconds.milliseconds)
        // or "02:39:41.6251432" (hours:minutes:seconds.milliseconds)
        const matchWithDays = uptimeString.match(/^(\d+)\.(\d+):(\d+):(\d+)/);
        const matchWithoutDays = uptimeString.match(/^(\d+):(\d+):(\d+)/);

        let totalSeconds = 0;

        if (matchWithDays) {
            const [, days, hours, minutes] = matchWithDays;
            totalSeconds = parseInt(days) * 86400 + parseInt(hours) * 3600 + parseInt(minutes) * 60;
        } else if (matchWithoutDays) {
            const [, hours, minutes, seconds] = matchWithoutDays;
            totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
        } else {
            return uptimeString;
        }

        const d = dayjs.duration(totalSeconds, "seconds");
        const daysNum = Math.floor(d.asDays());
        const hoursNum = d.hours();
        const minutesNum = d.minutes();

        const parts: string[] = [];
        if (daysNum > 0) parts.push(`${daysNum}j`);
        if (hoursNum > 0) parts.push(`${hoursNum}h`);
        if (minutesNum > 0) parts.push(`${minutesNum}min`);

        return parts.length > 0 ? parts.join(" ") : "< 1min";
    }

    function formatMemory(memoryMb: number): string {
        if (memoryMb >= 1024) {
            return `${(memoryMb / 1024).toFixed(1)} GB`;
        }
        return `${Math.round(memoryMb)} MB`;
    }

    const logoImage = (g: InstallableGameExtended) => (g.logo ? getGameResourceUrl(g, g.logo) : "");

    let logoError = $state(false);
</script>

<button
    onclick={() => goto(`/games/${server.gameSlug}`)}
    {disabled}
    class="group relative shrink-0 cursor-pointer overflow-hidden rounded-lg transition-transform disabled:cursor-not-allowed disabled:opacity-50">
    <!-- Game Poster (Rectangle) -->
    <div class="relative h-48 w-80">
        <img
            src={`${PUBLIC_MEDIAS_URL}/games/${server.gameSlug}/screenshot_small_1.webp`}
            alt={game.title}
            class="h-full w-full object-cover object-center" />

        <!-- Live Indicator (top left) -->
        <div class="absolute top-2 left-2 flex items-center gap-1.5 bg-green-500 px-2 py-1 shadow-lg">
            <Radio class="size-3 animate-pulse text-white" />
            <span class="text-xs font-semibold text-white uppercase">Live</span>
        </div>

        <!-- Port and Player Count (top right) -->
        <div class="absolute top-2 right-2 flex flex-col gap-1">
            <div class="rounded bg-black/60 px-2 py-1 backdrop-blur-sm">
                <span class="text-xs font-medium text-white">:{server.port}</span>
            </div>
            {#if serverPlayers}
                <div class="rounded bg-black/60 px-2 py-1 backdrop-blur-sm">
                    <span class="text-xs font-medium text-white">
                        {serverPlayers.players?.length} / {serverPlayers.maxPlayers}
                    </span>
                </div>
            {/if}
        </div>

        <!-- Gradient Overlay at bottom with logo/name -->
        <div class="absolute right-0 bottom-0 left-0 bg-linear-to-t from-black via-black/80 to-transparent p-3 pt-12">
            <div class="flex flex-col gap-2">
                <div class="flex items-end gap-3">
                    <!-- Game Logo or Title -->
                    {#if logoImage(game) && !logoError}
                        <img
                            src={logoImage(game)}
                            alt={game.title + " logo"}
                            onerror={() => (logoError = true)}
                            class="h-10 w-auto max-w-xs object-contain drop-shadow-md" />
                    {:else}
                        <h3 class="text-lg font-bold text-white">{game.title}</h3>
                    {/if}

                    <div class="ml-auto flex flex-col items-end gap-0.5">
                        <p class="inline-flex items-center gap-2 text-xs text-white/90">
                            <TimerIcon size={16} />
                            {#if server.uptime}
                                {formatUptime(server.uptime)}
                            {/if}
                        </p>
                    </div>
                </div>

                <!-- Player Avatars -->
                {#if enrichedPlayers && enrichedPlayers.length > 0}
                    {@const visiblePlayers = enrichedPlayers.slice(0, 3)}
                    {@const remainingPlayers = enrichedPlayers.slice(3)}
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-white/80">Joueurs:</span>
                        <div class="flex items-center">
                            {#each visiblePlayers as player, playerIndex}
                                <Tooltip.Root>
                                    <Tooltip.Trigger>
                                        <div
                                            style="z-index: {10 - playerIndex}; margin-left: {playerIndex > 0 ? '-4px' : '0'}"
                                            class="transition-all duration-200 hover:scale-110">
                                            <AvatarDiscord
                                                size={20}
                                                name={player.name}
                                                src={player.image}
                                                alt={player.name}
                                                decorationSrc={player.avatarDecoration} />
                                        </div>
                                    </Tooltip.Trigger>
                                    <Tooltip.Content>
                                        <p>{player.displayName}</p>
                                    </Tooltip.Content>
                                </Tooltip.Root>
                            {/each}

                            {#if remainingPlayers.length > 0}
                                <Tooltip.Root>
                                    <Tooltip.Trigger>
                                        <div
                                            class="flex h-5 w-5 items-center justify-center rounded-full border border-white/40 bg-white/20 text-xs font-medium text-white transition-all duration-200 hover:scale-110 hover:bg-white/30"
                                            style="margin-left: {visiblePlayers.length > 0 ? '-4px' : '0'}; z-index: 5">
                                            +{remainingPlayers.length}
                                        </div>
                                    </Tooltip.Trigger>
                                    <Tooltip.Content>
                                        <div class="max-w-48 space-y-1">
                                            <p class="font-medium">
                                                +{remainingPlayers.length} autre{remainingPlayers.length > 1 ? "s" : ""}
                                            </p>
                                            {#each remainingPlayers as player}
                                                <p class="text-sm">
                                                    {player.displayName}
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
        </div>
    </div>
</button>

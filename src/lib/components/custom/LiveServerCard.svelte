<script lang="ts">
    import { MemoryStick, Radio, TimerIcon } from "@lucide/svelte";
    import { PUBLIC_MEDIAS_URL } from "$env/static/public";
    import { goto } from "$app/navigation";
    import { getGameResourceUrl } from "$lib/utils";
    import dayjs from "dayjs";
    import duration from "dayjs/plugin/duration";
    import type { InstallableGameExtended } from "$lib/types";
    import { GamesStore } from "$src/lib/states/games.svelte";
    import type { DetectedServer } from "$src/lib/shared-models";

    dayjs.extend(duration);

    let {
        server,
        game,
        disabled = false,
    }: { server: DetectedServer; game: InstallableGameExtended; disabled?: boolean } = $props();

    let serverPlayers = $derived(GamesStore.findServerPlayers(server.gameSlug!));

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
    class="group relative shrink-0 cursor-pointer overflow-hidden rounded-lg transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100">
    <!-- Game Poster (Rectangle) -->
    <div class="relative h-32 w-80">
        <img
            src={`${PUBLIC_MEDIAS_URL}/games/${server.gameSlug}/screenshot_small_1.webp`}
            alt={game.title}
            class="h-full w-full object-cover object-center" />

        <!-- Live Indicator (top left) -->
        <div class="absolute top-2 left-2 flex items-center gap-1.5 bg-green-500 px-2 py-1 shadow-lg">
            <Radio class="size-3 animate-pulse text-white" />
            <span class="text-xs font-semibold text-white uppercase">Live</span>
        </div>

        <!-- Port (top right) -->
        <div class="absolute top-2 right-2 rounded bg-black/60 px-2 py-1 backdrop-blur-sm">
            <span class="text-xs font-medium text-white">:{server.port}</span>
        </div>

        {#if serverPlayers}
            <!-- Player Count (bottom right) -->
            <div
                class="px-2 absolute right-2 bottom-2 rounded bg-black/60 py-1 backdrop-blur-sm">
                <span class="text-xs font-medium text-white">
                    {serverPlayers.players?.length} / {serverPlayers.maxPlayers} joueurs
                </span>
            </div>
        {/if}

        <!-- Gradient Overlay at bottom with logo/name -->
        <div class="absolute right-0 bottom-0 left-0 bg-linear-to-t from-black via-black/80 to-transparent p-3 pt-8">
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
                    <!-- <p class="inline-flex items-center gap-2 text-xs text-white/90">
                        <MemoryStick size={16} />
                        {formatMemory(server.memoryMb)}
                    </p> -->
                </div>
            </div>
        </div>
    </div>
</button>

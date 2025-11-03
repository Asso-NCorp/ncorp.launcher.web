<script lang="ts">
    import { PUBLIC_MEDIAS_URL, PUBLIC_MEDIASOUP_URL } from "$env/static/public";
    import { fade, fly } from "svelte/transition";
    import LazyImage from "./LazyImage.svelte";
    import Loader from "./Loader.svelte";
    import Checkbox from "../ui/checkbox/checkbox.svelte";
    import Badge from "../ui/badge/badge.svelte";
    import { goto } from "$app/navigation";
    import GameActionButton from "./GameActionButton.svelte";
    import { t } from "$src/lib/translations";
    import { ArrowBigDown, ArrowDown, Clock, FolderOpen, LucideZap, Users, VerifiedIcon } from "@lucide/svelte";
    import InstalledBadge from "./badge/InstalledBadge.svelte";
    import Button from "../ui/button/button.svelte";
    import { getLocalApi, isRecentlyAdded } from "$src/lib/utils";
    import type { InstallableGameExtended } from "$src/lib/types";
    import WordRotate from "./WordRotate.svelte";
    import { liveUsers } from "$src/lib/states/live-users.svelte";
    import { Progress } from "../ui/progress";
    let { game }: { game: InstallableGameExtended } = $props();
    let currentScreenshot = $state(game.screenshots ? `screenshot_small_1.webp` : "");
    let showDetails = $state(false);
    let canScroll = $state(false);
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleMouseEnter = () => {
        showDetails = true;
        // Enable scrolling after 1 second delay
        scrollTimeout = setTimeout(() => {
            canScroll = true;
        }, 1000);
    };

    const handleMouseLeave = () => {
        showDetails = false;
        canScroll = false;
        // Clear the timeout if mouse leaves before delay completes
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
            scrollTimeout = null;
        }
    };

    const openGameFolder = async () => {
        await getLocalApi().openGameFolder({
            gameSlug: game.folderSlug,
        });
    };

    const isGameInstallingCurrentGame = $derived(
        liveUsers.currentUser?.activity?.gameSlug === game.folderSlug && game.isInstalling,
    );

    const STATUS_MIN_CH = 14; // fallback min width
    const STATUS_WORDS = ["Queued", "Waiting", "Downloading", "Extracting", "Installing", "Finalizing", "Verifying"]; // adjust if more
    const STATUS_LONGEST = STATUS_WORDS.reduce((a, b) => (b.length > a.length ? b : a), "");
</script>

<div
    id="game-card-{game.folderSlug}"
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
    class:ring-2={game.isSelected}
    class:ring-primary={game.isSelected}
    class="group/card relative flex h-80 max-w-60 flex-col overflow-hidden rounded-lg border bg-subtle/10 text-card-foreground backdrop-blur-sm transition-all duration-300 dark:backdrop-blur-none {game.isInstalled
        ? 'ring-green-500'
        : null}">
    <div class="h-full w-full">
        <!-- Live indicator -->
        {#if game.isPlaying && !showDetails}
            <div class="absolute left-2 top-2 z-20">
                <span class="relative flex size-3">
                    <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75">
                    </span>
                    <span class="relative inline-flex size-3 rounded-full bg-green-500"></span>
                </span>
            </div>
        {/if}

        <div class="relative">
            <!-- Reordered: image first, overlay second so no z-index needed -->
            {#if showDetails}
                <LazyImage
                    placeholderHeight="220px"
                    placeholderWidth="320px"
                    class="h-30 max-h-30 w-full overflow-hidden object-cover object-center"
                    src={`${PUBLIC_MEDIAS_URL}/games/${game.folderSlug}/${currentScreenshot}`}>
                    <Loader size={20} />
                </LazyImage>
            {:else}
                <div class="h-30 max-h-30 w-full overflow-hidden bg-subtle/20"></div>
            {/if}
            {#if showDetails}
                <div
                    onclick={() => goto(`/games/${game.folderSlug}`)}
                    class="absolute inset-0 flex h-auto w-full cursor-pointer px-4 opacity-0 group-hover/card:opacity-100"
                    title="Sélectionner">
                    {#each game.screenshots! as screen}
                        <div
                            onmouseenter={() => (currentScreenshot = `screenshot_small_${game.screenshots!.indexOf(screen) + 1}.webp`)}
                            class="group/notch flex h-full w-full flex-col px-1">
                            <div class="h-full w-full" />
                            <div class="h-2 w-full rounded-full bg-subtle/50 group-hover/notch:bg-white"></div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        {#if game.isPlaying && !showDetails}
            <div
                transition:fly={{ y: 20, duration: 300 }}
                class:bg-primary={!game.isPlaying}
                class:bg-success={game.isPlaying}
                class="absolute inset-x-0 bottom-0 left-1/2 z-20 -translate-x-1/2 rounded-t-[0.30rem] p-1 text-center text-xs font-bold uppercase text-white">
                {#if game.isPlaying}
                    <div>{$t("playing")}</div>
                {/if}
            </div>
        {/if}

        {#if showDetails}
            <div class="absolute left-2 top-2 flex flex-col items-center gap-2 {!showDetails ? 'opacity-0' : null}">
                <Checkbox id="select-{game.folderSlug}" bind:checked={game.isSelected} />
                <Button
                    disabled={!game.isInstalled}
                    onclick={() => openGameFolder()}
                    size="sm"
                    title="Ouvrir le dossier du jeu"
                    variant="ghost">
                    <FolderOpen size={16} />
                </Button>
            </div>
        {/if}

        {#if !showDetails}
            <!-- Cover moved BEFORE badges so badges paint above; pointer-events disabled -->
            <div class="pointer-events-none absolute inset-0 z-10" aria-hidden="true" transition:fade={{ duration: 100 }}>
                <LazyImage
                    placeholderHeight="220px"
                    placeholderWidth="320px"
                    src={`${PUBLIC_MEDIAS_URL}/games/${game.folderSlug}/poster_small.webp`}
                    class="h-full w-full overflow-hidden object-cover object-center">
                    <Loader size={20} />
                </LazyImage>
            </div>
        {/if}

        <!-- Badges/top-right -->
        <div class="absolute right-2 top-2 z-20 flex items-center">
            {#if isRecentlyAdded(game) && !game.isPlaying && !showDetails}
                <Badge
                    variant="secondary"
                    class="rounded-lg bg-info text-center text-xs font-bold uppercase text-white">
                    <div>{$t?.("new") || "NEW"}</div>
                </Badge>
            {/if}
            {#if game.isInstalled && !game.isInstalling && !showDetails}
                <div transition:fly={{ y: -30, duration: 200 }}><InstalledBadge /></div>
            {/if}
            {#if !showDetails}
                <div class="flex" transition:fly={{ y: -30, duration: 200 }}>
                    <Badge variant="secondary" class=" flex items-center text-nowrap rounded-lg px-1">
                        {#if game.sizeGb}
                            {#if game.sizeGb < 1}
                                {Math.round(game.sizeGb * 1024)} {$t("MB")}
                            {:else}
                                {Math.round(game.sizeGb)} {$t("GB")}
                            {/if}
                        {/if}
                    </Badge>
                    <Badge variant="secondary" class="flex items-center  px-1" title="Nombre de joueurs">
                        <Users class="h-4 w-4" />
                        <span>{game.maxPlayers}</span>
                    </Badge>
                    {#if game.isCompressedAvailable}
                        <Badge variant="default">
                            <LucideZap class="h-4 w-4" />
                        </Badge>
                    {/if}
                </div>
            {/if}
        </div>
    </div>

    <div class="flex h-full flex-col space-y-1.5 overflow-hidden p-2">
        <div
            role="heading"
            aria-level="3"
            class="flex items-center gap-2 pb-2 text-xl font-semibold leading-none tracking-tight">
            <a href="/games/{game.folderSlug}" class="hover:underline">{game.title}</a>
            {#if game.isInstalled && !game.isInstalling && showDetails}
                <div title={$t("installed")} class="flex items-center">
                    <VerifiedIcon class="h-4 w-4 text-green-500" />
                </div>
            {/if}
        </div>
        {#if showDetails}
            <div
                in:fly={{ y: 50 }}
                class="flex flex-1 flex-col space-y-2 {canScroll ? 'overflow-y-auto' : 'overflow-hidden'}">
                <div class="text-sm font-medium leading-none tracking-tight">
                    {game.description}
                </div>
                <div class="flex flex-col">
                    <div class="text-sm text-gray-500">
                        <span>
                            {$t("size")}: {game.sizeGb
                                ? game.sizeGb < 1
                                    ? Math.round(game.sizeGb * 1024) + " MB"
                                    : Math.round(game.sizeGb) + " GB"
                                : "N/A"}
                        </span>
                    </div>
                    <div class="text-sm text-gray-500">
                        <span>{$t("genres")}: {game.genresStr}</span>
                    </div>
                    <div class="text-sm text-gray-500">
                        <span>{$t("game_modes")}: {game.gameModes?.join(", ")}</span>
                    </div>
                    <div class="text-sm text-gray-500">
                        <span>{$t("max_players")}: {game.maxPlayers}</span>
                    </div>
                    <div class="text-sm text-gray-500">
                        <span>{$t("total_installs_count")}: {game.totalInstallations}</span>
                    </div>
                </div>
            </div>
        {/if}
    </div>

    {#if showDetails}
        <div class="flex h-auto w-full flex-col p-2">
            <GameActionButton {game} class="w-full" />
        </div>
    {/if}

    {#if game.isInstalling && !showDetails}
        <div
            class="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-black/50">
            {#if !game.isCancellingInstall}
                {#if isGameInstallingCurrentGame}
                    <ArrowDown class="absolute left-2 top-2 size-6 animate-bounce text-blue-600 " />
                {:else}
                    <div class="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80">
                        <Clock class="size-8" />
                        <span class="text-sm">Dans la file d'attente...</span>
                    </div>
                {/if}
            {/if}

            {#if game.isCancellingInstall}
                <div class="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80">
                    <Clock class="size-8" />
                    <span class="text-sm">Annulation en cours...</span>
                </div>
            {/if}

            {#if isGameInstallingCurrentGame && !game.isCancellingInstall}
                <div class="flex flex-col">
                    <div class="text-center text-white">
                        <WordRotate
                            class="text-white"
                            word={game.status}
                            minCh={STATUS_MIN_CH}
                            longest={STATUS_LONGEST} />
                    </div>
                </div>
            {/if}

            <!-- Gradient shadow for stats readability -->
            <div
                class="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/80 via-black/40 to-transparent">
            </div>

            <div
                class:hidden={!isGameInstallingCurrentGame}
                class="absolute inset-x-0 bottom-2 z-10 flex flex-col gap-2 px-2 text-xs">
                <div class="mx-auto flex flex-1 justify-evenly gap-2 w-full">
                    <span>📦{game.installProgress}%</span>
                    {#if liveUsers.currentUser?.downloadSpeedMegaBytesPerSecond && game.installProgress <= 50}
                        <span class="text-blue-600">↓</span>
                        <span>{liveUsers.currentUser.downloadSpeedMegaBytesPerSecond.toFixed(1)} Mo/s</span>
                    {/if}
                    {#if game.installProgress > 50}
                        <span>🍗 Extraction</span>
                    {/if}
                    {#if game.eta}
                        <span>⏳</span>
                        <span>{game.eta}</span>
                    {/if}
                </div>
                <Progress class="h-1 w-full" value={game.installProgress} />
            </div>
        </div>
    {/if}
</div>

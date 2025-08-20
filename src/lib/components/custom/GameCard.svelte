<script lang="ts">
    import { fly } from "svelte/transition";
    import LazyImage from "./LazyImage.svelte";
    import Loader from "./Loader.svelte";
    import Checkbox from "../ui/checkbox/checkbox.svelte";
    import Badge from "../ui/badge/badge.svelte";
    import { goto } from "$app/navigation";
    import GameActionButton from "./GameActionButton.svelte";
    import { t } from "$src/lib/translations";
    import { FolderOpen, LucideZap, Users, Verified, VerifiedIcon } from "@lucide/svelte";
    import InstalledBadge from "./badge/InstalledBadge.svelte";
    import { GamesStore } from "$src/lib/states/games.svelte";
    import type { InstallableGame } from "$src/lib/shared-models";
    import Button from "../ui/button/button.svelte";
    import { getLocalApi } from "$src/lib/utils";
    let { game }: { game: InstallableGame } = $props();
    let currentScreenshot = $state(game.screenshots ? game.screenshots[0] : "");
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
</script>

<div
    id="game-card-{game.folderSlug}"
    onmouseleave={handleMouseLeave}
    class:ring-2={game.isSelected}
    class:ring-primary={game.isSelected}
    class="group/card relative flex h-80 max-w-[15rem] flex-col overflow-hidden rounded-lg border bg-subtle/10 text-card-foreground backdrop-blur-sm transition-all duration-300 dark:backdrop-blur-none {game.isInstalled
        ? 'ring-green-500'
        : null}">
    <div class="h-full w-full" onmouseenter={() => handleMouseEnter()}>
        <!-- Cover -->
        {#if !showDetails}
            <div class="absolute inset-0 z-10 h-full w-full" transition:fly={{ y: -100, duration: 300 }}>
                <LazyImage
                    placeholderHeight="220px"
                    placeholderWidth="320px"
                    src={`/api/resources/${game.cover}`}
                    class=" h-full w-full overflow-hidden object-cover object-center">
                    <Loader size={20} />
                </LazyImage>
            </div>
        {/if}

        <!-- Live indicator -->
        {#if game.isPlaying && !showDetails}
            <div class="absolute left-2 top-2 z-50">
                <span class="relative flex size-3">
                    <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75">
                    </span>
                    <span class="relative inline-flex size-3 rounded-full bg-green-500"></span>
                </span>
            </div>
        {/if}

        <div class="relative">
            {#if showDetails}
                <div
                    onclick={() => goto(`/games/${game.folderSlug}`)}
                    class="absolute inset-0 flex h-auto w-full cursor-pointer px-4 opacity-0 group-hover/card:opacity-100"
                    title="Sélectionner">
                    {#each game.screenshots! as screen}
                        <div
                            onmouseenter={() => (currentScreenshot = screen)}
                            class="group/notch flex h-full w-full flex-col px-1">
                            <div class="h-full w-full" />
                            <div class="h-2 w-full rounded-full bg-subtle/50 group-hover/notch:bg-white"></div>
                        </div>
                    {/each}
                </div>
            {/if}
            <LazyImage
                placeholderHeight="220px"
                placeholderWidth="320px"
                class="h-[7.5rem] max-h-[7.5rem] w-full overflow-hidden object-cover object-center"
                src={`/api/resources/${currentScreenshot}`}>
                <Loader size={20} />
            </LazyImage>
        </div>

        {#if game.isPlaying && !showDetails}
            <div
                transition:fly={{ y: 20, duration: 300 }}
                class:bg-primary={!game.isPlaying}
                class:bg-success={game.isPlaying}
                class="absolute inset-x-0 bottom-0 left-1/2 z-50 -translate-x-1/2 rounded-t-[0.30rem] p-1 text-center text-xs font-bold uppercase text-white">
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

        <div class="absolute right-2 top-2 z-10 flex items-center">
            {#if game.isInstalled && !game.isInstalling && !showDetails}
                <div transition:fly={{ y: -30, duration: 200 }}><InstalledBadge /></div>
            {/if}
            {#if !showDetails}
                <div class="flex" transition:fly={{ y: -30, duration: 200 }}>
                    <Badge variant="secondary" class=" flex items-center text-nowrap rounded-[var(--radius)] px-1">
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
            </div>
        </div>
    </div>
    <div class="flex h-auto w-full flex-col p-2">
        <GameActionButton {game} class="w-full" />
    </div>

    {#if game.isInstalling && !showDetails}
        <div
            class="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center gap-2 bg-black bg-opacity-50">
            {#if game.installProgress > 0}
                <Loader size={40} class="!text-white" />
            {/if}
            <div class="flex flex-col">
                <div class="text-center text-white">{$t("install_in_progress")} ({game.installProgress}%)</div>
            </div>
            <br />
            <!-- <Progress class="absolute bottom-2 mx-auto h-4 w-2/3 px-2" value={game.installProgress} /> -->
        </div>
    {/if}
</div>

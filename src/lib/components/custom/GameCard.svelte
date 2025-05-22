<script lang="ts">
    import { fly } from "svelte/transition";
    import LazyImage from "./LazyImage.svelte";
    import Loader from "./Loader.svelte";
    import ScrollArea from "../ui/scroll-area/scroll-area.svelte";
    import Checkbox from "../ui/checkbox/checkbox.svelte";
    import Badge from "../ui/badge/badge.svelte";
    import { goto } from "$app/navigation";
    import GameActionButton from "./GameActionButton.svelte";
    import { t } from "$src/lib/translations";
    import { FolderOpen, LucideZap, VerifiedIcon } from "@lucide/svelte";
    import InstalledBadge from "./badge/InstalledBadge.svelte";
    import { GamesStore } from "$src/lib/stores/games.svelte";
    import type { InstallableGame } from "$src/lib/shared-models";
    import Button from "../ui/button/button.svelte";
    import { getLocalApi } from "$src/lib/utils";

    let { game, onCheckedChange }: { game: InstallableGame; onCheckedChange?: (checked: boolean) => void } = $props();
    let currentScreenshot = $state(game.screenshots ? game.screenshots[0] : "");
    let showDetails = $state(false);
    let checked = $state(game.isSelected || false);

    const handleMouseEnter = () => {
        showDetails = true;
    };

    const handleMouseLeave = () => {
        showDetails = false;
    };

    const handleOnClicked = () => {
        onCheckedChange?.(checked);
        GamesStore.toggleSelect(game);
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
    class:ring-2={checked}
    class:ring-primary={checked}
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
                <Checkbox onclick={() => handleOnClicked()} id="select-{game.folderSlug}" bind:checked />
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
            {#if !showDetails && game.sizeGb}
                <div class="flex" transition:fly={{ y: -30, duration: 200 }}>
                    <Badge variant="secondary" class="rounded-[var(--radius)] py-0.5">
                        {#if game.sizeGb < 1}
                            {Math.round(game.sizeGb * 1024)} {$t("MB")}
                        {:else}
                            {Math.round(game.sizeGb)} {$t("GB")}
                        {/if}
                    </Badge>
                    {#if game.isCompressedAvailable}
                        <Badge variant="default" class="py-0.5">
                            <LucideZap class="h-4 w-4" />
                        </Badge>
                    {/if}
                </div>
            {/if}
        </div>
    </div>

    <ScrollArea class="h-full space-y-1.5 p-2">
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

        <div in:fly={{ y: 50 }} class="flex flex-col space-y-2">
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
                    <span>{$t("max_players")}: {game.maxPlayers}</span>
                </div>
            </div>
        </div>
    </ScrollArea>
    <div class="flex h-auto w-full flex-col p-2">
        <GameActionButton {game} class="w-full" />
    </div>

    {#if game.isInstalling && !showDetails}
        <div
            class="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center gap-2 bg-black bg-opacity-50">
            <Loader size={40} class="!text-white" />
            <div class="flex flex-col">
                <div class="text-center text-white">{$t("install_in_progress")} ({game.installProgress}%)</div>
            </div>
            <br />
            <!-- <Progress class="absolute bottom-2 mx-auto h-4 w-2/3 px-2" value={game.installProgress} /> -->
        </div>
    {/if}
</div>

<script lang="ts">
    import LazyImage from "$src/lib/components/custom/LazyImage.svelte";
    import { getGameResourceUrl, getLocalApi, getRandomScreenshot } from "$src/lib/utils";
    import Button from "$src/lib/components/ui/button/button.svelte";
    import { ArrowLeft, FolderOpen } from "@lucide/svelte";
    import { onNavigate } from "$app/navigation";
    import Badge from "$src/lib/components/ui/badge/badge.svelte";
    import GameActionButton from "$src/lib/components/custom/GameActionButton.svelte";
    import { fly } from "svelte/transition";
    import { t } from "$src/lib/translations";
    import { GamesStore } from "$src/lib/states/games.svelte";
    import { global } from "$src/lib/states/global.svelte";
    import { type PageData } from "./$types";
    import BiggerPicture from "bigger-picture/vanilla";
    import "bigger-picture/css";
    import { onMount } from "svelte";
    import { toast } from "svelte-sonner";
    import { PUBLIC_MEDIAS_URL, PUBLIC_BACKEND_API_URL } from "$env/static/public";
    import { getGameTrailer } from "$src/lib/backend";
    import VideoPlayer from "$src/lib/components/custom/VideoPlayer.svelte";

    let { data }: { data: PageData } = $props();
    const game = data.game;

    let reactiveGame = $derived(GamesStore.get(game.folderSlug!) || game);
    let trailerUrl = $state<string | null>(null);
    let loadingTrailer = $state(false);

    if (game?.screenshots) {
        var randomScreenshot = Math.floor(Math.random() * game.screenshots.length);
        if (randomScreenshot) {
            global.mainBackgroundImage = `${PUBLIC_MEDIAS_URL}/games/${game.folderSlug}/screenshot_full_${randomScreenshot}.webp`;  
        }
    }

    onNavigate(() => {
        global.mainBackgroundImage = undefined;
    });

    let bp: BiggerPicture;
    let imageLinks: NodeListOf<HTMLAnchorElement>;

    function runBiggerPicture() {
        bp = BiggerPicture({
            target: document.body,
        });

        imageLinks = document.querySelectorAll("#screenshots > a");
        imageLinks.forEach((imageLink) => {
            imageLink.addEventListener("click", openGallery);
        });
    }

    function openGallery(e: MouseEvent) {
        e.preventDefault();
        bp.open({
            items: imageLinks,
            el: e.currentTarget,
        });
    }

    const handleOpenGameFolder = async () => {
        try {
            await getLocalApi().openGameFolder({
                gameSlug: game?.folderSlug,
            });
        } catch (error) {
            console.error(error);
            toast.error($t("error_opening_game_folder"));
        }
    };

    const loadTrailer = async () => {
        if (!game.steamAppId || trailerUrl || loadingTrailer) return;
        loadingTrailer = true;
        try {
            const trailer = await getGameTrailer({
                baseUrl: PUBLIC_BACKEND_API_URL,
                query: { steamAppId: game.steamAppId },
            });
            trailerUrl = trailer?.data || null;
        } catch (error) {
            console.error("Error loading trailer:", error);
            trailerUrl = null;
        } finally {
            loadingTrailer = false;
        }
    };

    onMount(() => {
        runBiggerPicture();
        if (game.steamAppId) {
            loadTrailer();
        }
    });
</script>

{#if game}
    <div class="relative flex w-full flex-col gap-4">
        <Button variant="ghost" class="w-auto self-start" onclick={() => window.history.back()}>
            <ArrowLeft />
            {$t("back")}
        </Button>
        <div class="flex items-center justify-between">
            {#if game.logo}
                <LazyImage
                    src={getGameResourceUrl(game, game.logo)}
                    alt={game.title}
                    class="h-28 max-h-28 w-auto object-contain"
                    placeholderWidth="320"
                    placeholderHeight="80" />
            {:else}
                <h1
                    in:fly|global={{ y: -40, delay: 300, duration: 200 }}
                    out:fly|global={{ y: 40, duration: 10 }}
                    class="font-clash text-3xl font-bold">
                    {game.title}
                </h1>
            {/if}
            <div class="flex">
                <Button
                    variant="secondary"
                    disabled={!reactiveGame.isInstalled}
                    class="h-auto"
                    onclick={handleOpenGameFolder}
                    title="Ouvrir le dossier du jeu">
                    <FolderOpen />
                </Button>
                <GameActionButton game={reactiveGame} uninstallVariant="ghost" />
            </div>
        </div>
        <div class="flex items-center gap-2">
            <span class="text-sm underline">{game.genres}</span>
            <Badge variant="secondary" class="border border-gray-300 dark:border-gray-900">
                {$t("size")} : {game.sizeGb}
                {$t("GB")}
            </Badge>
        </div>
        <p>{game.description}</p>

        <div id="screenshots" class="grid grid-cols-5 gap-2 lg:h-52">
            {#if game.steamAppId && trailerUrl}
                <VideoPlayer
                    src={trailerUrl}
                    poster={`${PUBLIC_MEDIAS_URL}/games/${game.folderSlug}/screenshot_full_1.webp`}
                    title={game.title}
                    class="col-span-2 row-span-2" />
            {:else if game.steamAppId && loadingTrailer}
                <div class="col-span-2 row-span-2 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground">
                    Chargement du trailer...
                </div>
            {/if}

            {#if game.screenshots}
                {#each game.screenshots as screenshot, i}
                    <a in:fly|global={{ y: -40, duration: 300, delay: 100 * i }} class="h-full w-full">
                        <LazyImage
                            data-img={`${PUBLIC_MEDIAS_URL}/games/${game.folderSlug}/screenshot_full_${i + 1}.webp`}
                            data-thumb={`${PUBLIC_MEDIAS_URL}/games/${game.folderSlug}/screenshot_full_${i + 1}.webp`}
                            data-alt={`Screenshot ${i + 1}`}
                            src={`${PUBLIC_MEDIAS_URL}/games/${game.folderSlug}/screenshot_full_${i + 1}.webp`}
                            alt={`Screenshot ${i + 1}`}
                            class="h-full w-full object-cover hover:outline-none hover:ring-2 hover:ring-ring hover:ring-offset-2 dark:hover:ring-offset-0" />
                    </a>
                {/each}
            {/if}
        </div>
    </div>
{:else if game === undefined && GamesStore.games.length > 0 && GamesStore.isLoading == false}
    <p class="text-center text-2xl text-secondary-foreground">{$t("game_not_found")} 🤨</p>
    <img src="/img/huhcat.gif" alt="404" class="mx-auto w-1/4 pt-10" />
    <Button variant="outline" href="/all-games">
        <ArrowLeft />
        {$t("back")}
    </Button>
{/if}

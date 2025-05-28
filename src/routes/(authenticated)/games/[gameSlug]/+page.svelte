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
    import { GamesStore } from "$src/lib/stores/games.svelte";
    import { global } from "$src/lib/states/global.svelte";
    import { type PageData } from "./$types";
    import BiggerPicture from "bigger-picture/vanilla";
    import "bigger-picture/css";
    import { onMount } from "svelte";
    import { toast } from "svelte-sonner";

    let { data }: { data: PageData } = $props();
    const game = data.game;

    if (game?.screenshots) {
        var randomScreenshot = getRandomScreenshot(game);
        if (randomScreenshot) {
            global.mainBackgroundImage = getGameResourceUrl(game, randomScreenshot);
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

    onMount(() => {
        runBiggerPicture();
    });
</script>

{#if game}
    <div class="relative flex h-full w-full flex-col gap-4">
        <Button variant="ghost" class="w-auto self-start" onclick={() => window.history.back()}>
            <ArrowLeft />
            {$t("back")}
        </Button>
        <div class="flex items-center justify-between">
            <h1
                in:fly|global={{ y: -40, delay: 300, duration: 200 }}
                out:fly|global={{ y: 40, duration: 10 }}
                class="font-clash text-3xl font-bold">
                {game.title}
            </h1>
            <div class="flex">
                <Button
                    variant="secondary"
                    disabled={!game.isInstalled}
                    onclick={handleOpenGameFolder}
                    title="Ouvrir le dossier du jeu">
                    <FolderOpen />
                </Button>
                <GameActionButton {game} uninstallVariant="ghost" />
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
            {#if game.screenshots}
                {#each game.screenshots as screenshot, i}
                    <a in:fly|global={{ y: -40, duration: 300, delay: 100 * i }} class="h-full w-full">
                        <LazyImage
                            data-img={getGameResourceUrl(game, screenshot)}
                            data-thumb={getGameResourceUrl(game, screenshot)}
                            data-alt={`Screenshot ${i + 1}`}
                            src={getGameResourceUrl(game, screenshot)}
                            alt={`Screenshot ${i + 1}`}
                            class="h-full w-full object-cover hover:outline-none hover:ring-2 hover:ring-ring hover:ring-offset-2 dark:hover:ring-offset-0" />
                    </a>
                {/each}
            {/if}
        </div>
    </div>
{:else if game === undefined && GamesStore.games.length > 0 && GamesStore.gamesLoading == false}
    <p class="text-center text-2xl text-secondary-foreground">{$t("game_not_found")} 🤨</p>
    <img src="/img/huhcat.gif" alt="404" class="mx-auto w-1/4 pt-10" />
    <Button variant="outline" href="/all-games">
        <ArrowLeft />
        {$t("back")}
    </Button>
{/if}

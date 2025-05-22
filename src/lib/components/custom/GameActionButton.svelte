<script lang="ts">
    import { Button } from "../ui/icon-button";
    import { ArrowBigDownDash, ArrowBigUpDash, Play, StopCircle, ZapIcon } from "@lucide/svelte";
    import { t } from "$src/lib/translations";
    import { cn, getLocalApi } from "$src/lib/utils";
    import { GamesStore } from "$src/lib/stores/games.svelte";
    import { type InstallableGame } from "$src/lib/shared-models";
    import { liveAgentConnection } from "$src/lib/states/live-agent.svelte";
    import { liveServerConnection } from "$src/lib/states/live-server.svelte";

    let {
        game: installableGame,
        class: klazz,
        uninstallVariant = "destructive",
    }: {
        game: InstallableGame;
        class?: string;
        uninstallVariant?:
            | "ghost"
            | "destructive"
            | "default"
            | "link"
            | "outline"
            | "secondary"
            | "success"
            | undefined;
    } = $props();

    const game = $derived(installableGame);
    let downloadIcon = game.isCompressedAvailable ? ZapIcon : ArrowBigDownDash;
    const localApi = getLocalApi();

    const handlePlayClick = async () => {
        if (game.isInstalled) {
            try {
                game.isLoading = true;
                await localApi.startGame({
                    gameSlug: game.folderSlug,
                });
                // await liveServerConnection.connection.invoke("GameStarted", game);
            } catch (error) {
                console.error(error);
            } finally {
                game.isLoading = false;
            }
        }
    };

    const handleExitClick = async () => {
        try {
            await localApi.stopGame({
                slug: game.folderSlug,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleInstallClick = async () => {
        await GamesStore.installGame(game);
    };

    const handleUninstallClick = async () => {
        await GamesStore.uninstallGame(game);
    };
</script>

<div>
    {#if liveAgentConnection.connectionState === "Connected" && liveServerConnection.connectionState === "Connected"}
        {#if game.isInstalling}
            <Button
                isLoading={game.isInstalling}
                disabled={game.isInstalling}
                class={cn("w-auto", klazz)}
                icon={ArrowBigUpDash}>
                {$t("installing")}
            </Button>
        {:else if game.isInstalled}
            <div class="flex items-center">
                {#if game.isPlaying}
                    <Button
                        variant="destructive"
                        class={cn("w-auto", klazz)}
                        onclick={handleExitClick}
                        icon={StopCircle}>
                        {$t("exit")}
                    </Button>
                {:else}
                    <Button
                        isLoading={game.isInstalling || game.isLoading || game.isPlaying}
                        disabled={game.isInstalling || game.isLoading || game.isPlaying}
                        variant="success"
                        class={cn("w-auto", klazz)}
                        onclick={handlePlayClick}
                        icon={Play}>
                        {$t("play")}
                    </Button>
                {/if}
                <Button
                    isLoading={game.isInstalling}
                    disabled={game.isInstalling || game.isLoading || game.isPlaying}
                    variant="secondary"
                    class={cn("w-auto", klazz)}
                    icon={ArrowBigUpDash}
                    onclick={handleUninstallClick}>
                    {$t("uninstall")}
                </Button>
            </div>
        {:else}
            <Button
                isLoading={game.isInstalling}
                disabled={game.isInstalling}
                variant="info"
                class={cn("w-auto", klazz)}
                icon={downloadIcon}
                onclick={handleInstallClick}>
                {$t("install")}
            </Button>
        {/if}
    {:else}
        <Button disabled={true} class={cn("w-auto", klazz)} icon={ArrowBigUpDash}>
            {$t("agent_not_connected")}
        </Button>
    {/if}
</div>

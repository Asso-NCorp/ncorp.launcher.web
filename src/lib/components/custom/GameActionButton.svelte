<script lang="ts">
    import { Button } from "../ui/icon-button";
    import { ArrowBigDownDash, ArrowBigUpDash, Play, Server, StopCircle, TrashIcon, ZapIcon } from "@lucide/svelte";
    import { t } from "$src/lib/translations";
    import { cn, getLocalApi } from "$src/lib/utils";
    import { GamesStore } from "$src/lib/states/games.svelte";
    import { type InstallableGame } from "$src/lib/shared-models";
    import { liveAgentConnection } from "$src/lib/states/live-agent.svelte";
    import { liveServerConnection } from "$src/lib/states/live-server.svelte";
    import type { InstallableGameExtended } from "$src/lib/types";
    import { toast } from "svelte-sonner";

    let {
        game: installableGame,
        class: klazz,
        uninstallVariant = "destructive",
    }: {
        game: InstallableGameExtended;
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

    const handleStartServerClick = async () => {
        try {
            await localApi.startServer({
                gameSlug: game.folderSlug,
            });
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors du démarrage du serveur local : " + (error as Error).message, { class: "bg-red-500" });
        }
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
                <div class="flex gap-2">
                    <Button
                        isLoading={game.isInstalling || game.isLoading || game.isPlaying}
                        disabled={game.isInstalling || game.isLoading || game.isPlaying}
                        variant="success"
                        class={cn("w-auto", klazz)}
                        onclick={handlePlayClick}
                        icon={Play}>
                        {$t("launch")}
                    </Button>
                    {#if game.hasLocalServer}
                        <Button
                            isLoading={game.isInstalling || game.isLoading || game.isPlaying}
                            disabled={game.isInstalling || game.isLoading || game.isPlaying}
                            variant="default"
                            title={$t("start_server")}
                            class={cn("w-auto", klazz)}
                            onclick={handleStartServerClick}
                            icon={Server}>
                        </Button>
                    {/if}
                </div>
                {/if}
                <Button
                    isLoading={game.isInstalling}
                    disabled={game.isInstalling || game.isLoading || game.isPlaying}
                    variant="secondary"
                    title={$t("uninstall")}
                    class={cn("w-auto", klazz)}
                    icon={TrashIcon}
                    onclick={handleUninstallClick}>
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

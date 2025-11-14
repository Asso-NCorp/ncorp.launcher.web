<script lang="ts">
    import { Button } from "../ui/icon-button";
    import {
        ArrowBigDownDash,
        ArrowBigUpDash,
        CircleStop,
        Play,
        RefreshCw,
        Server,
        Trash2Icon,
        ZapIcon,
    } from "@lucide/svelte";
    import { t } from "$src/lib/translations";
    import { cn, getLocalApi } from "$src/lib/utils";
    import { GamesStore } from "$src/lib/states/games.svelte";
    import { liveAgentConnection } from "$src/lib/states/live-agent.svelte";
    import { liveServerConnection } from "$src/lib/states/live-server.svelte";
    import { reinstallModalStore } from "$src/lib/states/reinstall-modal.svelte";
    import type { InstallableGameExtended } from "$src/lib/types";
    import { toast } from "svelte-sonner";
    import { Progress } from "../ui/progress";
    
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
    let isGameQuitting = $state(false);


    const handleStartAgentClick = async () => {
        try {
            window.open("nagent://start", "_self");
            GamesStore.isLoading = false;
        } catch (error) {
            toast.error("Erreur lors du démarrage de l'agent");
        }
    };

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
            isGameQuitting = true;
            await localApi.stopGame({
                slug: game.folderSlug,
            });
        } catch (error) {
            console.error(error);
        } finally {
            isGameQuitting = false;
        }
    };

    const handleInstallClick = async () => {
        await GamesStore.installGame(game);
    };

    const handleUninstallClick = async () => {
        await GamesStore.uninstallGame(game);
    };

    const handleCancelClick = async () => {
        try {
            game.isCancellingInstall = true;
            await localApi.cancelInstallation({
                gameSlug: game.folderSlug,
            });
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de l'annulation de l'installation : " + (error as Error).message, {
                class: "bg-red-500",
            });
        }finally {
            game.isCancellingInstall = false;
        }
    };

    const handleStartServerClick = async () => {
        try {
            await localApi.startServer({
                gameSlug: game.folderSlug,
            });
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors du démarrage du serveur local : " + (error as Error).message, {
                class: "bg-red-500",
            });
        }
    };
</script>

<div>
    {#if liveAgentConnection.connectionState === "Connected" && liveServerConnection.connectionState === "Connected"}
        {#if game.isInstalling}
            <div class="flex flex-col items-center gap-1 overflow-hidden">
                <Button
                    isLoading={game.isCancellingInstall}
                    disabled={game.isCancellingInstall || game.installProgress > 50}
                    variant="destructive"
                    class={cn("w-auto", klazz)}
                    icon={CircleStop}
                    onclick={handleCancelClick}>
                    {$t("cancel")}
                    {game.installProgress ? ` (${game.installProgress}%)` : ""}
                </Button>
                <Progress
                    class="h-1 w-full"
                    value={game.installProgress}
                    max={100}
                    aria-label="Installation progress" />
            </div>
        {:else if game.isInstalled}
            <div class="flex items-center">
                {#if game.isPlaying}
                    <Button
                        variant="destructive"
                        class={cn("w-auto", klazz)}
                        isLoading={isGameQuitting}
                        disabled={isGameQuitting}
                        onclick={handleExitClick}
                        icon={CircleStop}>
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
                        </Button>

                        <Button
                            isLoading={game.isInstalling || game.isLoading || game.isPlaying}
                            disabled={game.isInstalling || game.isLoading || game.isPlaying}
                            variant="info"
                            title={$t("reinstall")}
                            class={cn("w-auto", klazz)}
                            onclick={() => reinstallModalStore.open(game)}
                            icon={RefreshCw}>
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
                    class={cn("text-danger w-auto", klazz)}
                    icon={Trash2Icon}
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
        <Button onclick={handleStartAgentClick} class={cn("w-auto", klazz)} icon={ArrowBigUpDash}>
            {$t("start_agent")}
        </Button>
    {/if}
</div>

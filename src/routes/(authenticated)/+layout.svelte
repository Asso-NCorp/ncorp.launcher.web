<script lang="ts">
    import "$src/app.css";
    import { t } from "$lib/translations";
    import Header from "$src/lib/components/custom/Header.svelte";
    import SideMenu from "$src/lib/components/custom/SideMenu.svelte";
    import { page } from "$app/state";
    import { AlertTriangle, Folder, Gamepad2, MoveRight } from "@lucide/svelte";
    import SideMenuItem from "$src/lib/components/custom/SideMenuItem.svelte";
    import Loader from "$src/lib/components/custom/Loader.svelte";
    import Lights from "$src/lib/components/custom/Lights.svelte";
    import { getLocalApi } from "$src/lib/utils";
    import { onDestroy, onMount } from "svelte";
    import { type User } from "$src/lib/auth/client";
    import AdminMenu from "$src/lib/components/custom/AdminMenu.svelte";
    import SideLinks from "$src/lib/components/custom/SideLinks.svelte";
    import "@fontsource-variable/rubik";
    import { fade, fly } from "svelte/transition";
    import { afterNavigate, beforeNavigate, goto, onNavigate } from "$app/navigation";
    import { browser } from "$app/environment";
    import LazyImage from "$src/lib/components/custom/LazyImage.svelte";
    import { Toaster } from "$lib/components/ui/sonner/index.js";
    import { global } from "$src/lib/states/global.svelte";
    import { TooltipProvider } from "$src/lib/components/ui/tooltip";
    import { liveServerConnection } from "$src/lib/states/live-server.svelte";
    import { liveUsers } from "$src/lib/states/live-users.svelte";
    import { liveAgentConnection } from "$src/lib/states/live-agent.svelte";
    import LiveUsers from "$src/lib/components/custom/LiveUsers.svelte";
    import SuperJSON from "superjson";
    import { Card } from "$src/lib/components/ui/card";
    import ThemeProvider from "$src/lib/components/theme/ThemeProvider.svelte";
    import ThemSelectorAdvanced from "$src/lib/components/theme/ThemSelectorAdvanced.svelte";
    import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
    import ProfileDropdown from "$src/lib/components/custom/dropdowns/ProfileDropdown.svelte";
    import { SignalREventBinder } from "$src/lib/signalr-events";
    import { GamesStore } from "$src/lib/stores/games.svelte";

    let loading = $state(false);
    let { children } = $props();
    const user = page.data["user"] as User;
    global.localGamesFolder = page.data.localGamesDir;
    let showConfigGamesDirDialog = $state(false);

    global.currentUser = user;
    liveUsers.users = page.data.liveUsers;

    onNavigate((navigation) => {
        if (!document.startViewTransition) return;

        return new Promise((resolve) => {
            document.startViewTransition(async () => {
                resolve();
                await navigation.complete;
                loading = false;
            });
        });
    });

    afterNavigate((event) => {
        if (event.to?.url?.pathname) {
            global.currentPath = event.to.url.pathname;
        }
    });

    beforeNavigate(() => {
        loading = true;
    });

    let heartbeatInterval: ReturnType<typeof setInterval> | undefined;

    onMount(async () => {
        try {
            await getLocalApi().authenticate({ redirect: false });
        } catch (error) {
            console.error(error);
        }

        if (browser) {
            if (localStorage.getItem("gamesSortOrder")) {
                global.gamesSortOrder = localStorage.getItem("gamesSortOrder") as "asc" | "desc";
            }

            SignalREventBinder.bindAllEvents(liveServerConnection, liveAgentConnection, {
                showConfigGamesDirDialogSetter: (v) => (showConfigGamesDirDialog = v),
            });

            if (!global.localGamesFolder) {
                showConfigGamesDirDialog = true;
            } else {
                await GamesStore.getAvailableGames();
            }
        }
    });

    onDestroy(() => {
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
        }

        if (liveAgentConnection?.connection) {
            liveAgentConnection.connection.stop();
        }

        if (liveServerConnection?.connection) {
            liveServerConnection.connection.stop();
        }
    });
</script>

<Lights direction="top" class="absolute top-0 h-56 dark:hidden" />

<AlertDialog.Root open={showConfigGamesDirDialog}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Configurer le répertoire des jeux</AlertDialog.Title>
            <AlertDialog.Description>
                <div class="flex w-full items-center justify-between gap-2">
                    <Gamepad2 class="size-20 p-4 text-primary" />
                    <MoveRight class="size-20 p-4 text-yellow-600" />
                    <Folder class="size-20 p-4 text-primary" />
                </div>
                Avant de continuer vous devez configurer le répertoire où seront installés les jeux.
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Action
                onclick={() => {
                    goto("/my/settings");
                    showConfigGamesDirDialog = false;
                }}>
                Continuer
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>

<Toaster richColors position="top-center" expand />
{#if global.mainBackgroundImage}
    <div in:fade={{ duration: 200, delay: 600 }} out:fade={{ duration: 200 }}>
        <LazyImage
            src={global.mainBackgroundImage}
            alt="Background"
            class="pointer-events-none absolute top-0 -z-10 h-1/4 w-full object-cover opacity-50 [mask-image:linear-gradient(hsl(var(--background)),transparent)]" />
    </div>
{/if}
<ThemeProvider>
    <TooltipProvider delayDuration={100}>
        <div class="mx-auto flex h-screen flex-col overflow-hidden">
            {#if liveServerConnection.connectionState === "Reconnecting" || liveAgentConnection.connectionState === "Reconnecting"}
                <div
                    transition:fly={{ y: -20, duration: 200 }}
                    class="absolute left-1/2 top-0 z-50 mx-auto flex h-auto w-auto -translate-x-1/2 items-center justify-center gap-2 bg-warning px-2 py-1 text-center text-xl shadow-md drop-shadow-md">
                    <AlertTriangle />
                    <span>
                        CONNEXION
                        {#if liveServerConnection.connectionState === "Reconnecting"}
                            [SERVEUR]
                        {:else}
                            [AGENT]
                        {/if}
                        PERDUE. TENTATIVE DE RECONNEXION EN COURS...
                    </span>
                    <Loader size={24} class="!text-white" />
                </div>
            {/if}
            <Header class="relative h-12 bg-card shadow-sm backdrop-blur dark:shadow-none" {loading}>
                <ThemSelectorAdvanced />
            </Header>

            <div class="flex flex-1 overflow-hidden">
                <SideMenu class="h-full self-start bg-card">
                    <div class="mt-auto flex h-full w-full">
                        <ProfileDropdown {user} />
                    </div>
                </SideMenu>

                <div class="flex-1 overflow-y-auto overflow-x-hidden p-2">
                    {@render children?.()}
                </div>

                <aside class="h-full w-[209px] flex-shrink-0 border border-y-0 border-border bg-card">
                    <Card class="h-full border-0 p-2">
                        <LiveUsers />
                    </Card>
                </aside>
            </div>
        </div>
    </TooltipProvider>
</ThemeProvider>

<style>
    @keyframes fade-in {
        from {
            opacity: 0;
        }
    }

    @keyframes fade-out {
        to {
            opacity: 0;
        }
    }

    @keyframes slide-from-right {
        from {
            transform: translateX(30px);
        }
    }

    @keyframes slide-to-left {
        to {
            transform: translateX(-30px);
        }
    }

    :root::view-transition-old(root) {
        animation:
            90ms cubic-bezier(0.4, 0, 1, 1) both fade-out,
            300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-to-left;
    }

    :root::view-transition-new(root) {
        animation:
            210ms cubic-bezier(0, 0, 0.2, 1) 90ms both fade-in,
            300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-from-right;
    }

    aside {
        view-transition-name: live-users;
    }
</style>

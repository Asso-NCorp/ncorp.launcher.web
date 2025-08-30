<script lang="ts">
    import "$src/app.css";
    import Header from "$src/lib/components/custom/Header.svelte";
    import SideMenu from "$src/lib/components/custom/SideMenu.svelte";
    import { TriangleAlert, Folder, Gamepad2, MoveRight, ChevronLeft, Menu, Calendar } from "@lucide/svelte";
    import { version } from "$lib/version";
    import Loader from "$src/lib/components/custom/Loader.svelte";
    import Lights from "$src/lib/components/custom/Lights.svelte";
    import { getLocalApi, cn } from "$src/lib/utils";
    import { onDestroy, onMount } from "svelte";
    import * as Tooltip from "$lib/components/ui/tooltip/index.js";
    import "@fontsource-variable/rubik";
    import { fade, fly } from "svelte/transition";
    import { afterNavigate, beforeNavigate, goto, onNavigate } from "$app/navigation";
    import { browser } from "$app/environment";
    import LazyImage from "$src/lib/components/custom/LazyImage.svelte";
    import { Toaster } from "$lib/components/ui/sonner/index.js";
    import { TooltipProvider } from "$src/lib/components/ui/tooltip";
    import { liveServerConnection } from "$src/lib/states/live-server.svelte";
    import { liveUsers } from "$src/lib/states/live-users.svelte";
    import { liveAgentConnection } from "$src/lib/states/live-agent.svelte";
    import LiveUsers from "$src/lib/components/custom/LiveUsers.svelte";
    import ThemeProvider from "$src/lib/components/theme/ThemeProvider.svelte";
    import ThemSelectorAdvanced from "$src/lib/components/theme/ThemSelectorAdvanced.svelte";
    import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
    import ProfileDropdown from "$src/lib/components/custom/dropdowns/ProfileDropdown.svelte";
    import { SignalREventBinder } from "$src/lib/signalr-events";
    import { GamesStore } from "$src/lib/states/games.svelte";
    import NcorpGlitch from "$src/lib/components/custom/NcorpGlitch.svelte";
    import { global } from "$src/lib/states/global.svelte";
    import * as DropdownMenu from "$src/lib/components/ui/dropdown-menu/index.js";
    import UserStatusDot from "$src/lib/components/custom/UserStatusDot.svelte";
    import { buttonVariants } from "$src/lib/components/ui/button";
    import dayjs from "dayjs";
    import relativeTime from "dayjs/plugin/relativeTime";
    import utc from "dayjs/plugin/utc";
    import customParseFormat from "dayjs/plugin/customParseFormat";
    import "dayjs/locale/fr";
    import type { LayoutProps } from "./$types";
    import { Progress } from "$src/lib/components/ui/progress";
    import Separator from "$src/lib/components/ui/separator/separator.svelte";
    import { toast } from "svelte-sonner";
    import WinnerOverlay from "$src/lib/components/custom/WinnerOverlay.svelte";
    import HeaderMessage from "$src/lib/components/custom/HeaderMessage.svelte";
    import StatusDot from "$src/lib/components/custom/StatusDot.svelte";
    let loading = $state(false);
    let rightSidebarHidden = $state(false);
    let { data, children }: LayoutProps = $props(); // Configure dayjs
    dayjs.extend(relativeTime);
    dayjs.extend(utc);
    dayjs.extend(customParseFormat);
    dayjs.locale("fr");

    // Create UTC-first dayjs instance
    const dayjsUtc = (date?: dayjs.ConfigType) => dayjs.utc(date);

    // Auto-collapse sidebar on smaller screens
    $effect(() => {
        if (typeof window !== "undefined") {
            const handleResize = () => {
                if (window.innerWidth < 768) {
                    // md breakpoint
                    global.sidebarCollapsed = true;
                    rightSidebarHidden = true;
                } else if (window.innerWidth >= 1024) {
                    // lg breakpoint
                    global.sidebarCollapsed = false;
                    rightSidebarHidden = false;
                } else if (window.innerWidth >= 768) {
                    // md to lg
                    rightSidebarHidden = true;
                }
            };

            handleResize(); // Initial check
            window.addEventListener("resize", handleResize);

            return () => {
                window.removeEventListener("resize", handleResize);
            };
        }
    });
    const user = data.user;
    const events = data.events;
    global.localGamesFolder = data.localGamesDir;
    let showConfigGamesDirDialog = $state(false);
    global.currentUser = user;
    liveUsers.users = data.liveUsers; // Filter and sort upcoming events
    GamesStore.setGames(data.availableGames ?? []);

    const upcomingEvents = $derived(() => {
        const now = new Date();
        return events
            .filter((event) => new Date(event.start_time) > now)
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
            .slice(0, 5); // Show only next 5 events
    });

    const formatRelativeTime = (date: Date) => {
        return dayjsUtc(date).fromNow();
    };

    const formatDateTime = (date: Date) => {
        return dayjsUtc(date).format("DD/MM/YYYY HH:mm");
    };

    const toggleSidebar = () => {
        global.sidebarCollapsed = !global.sidebarCollapsed;
    };

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
        global.gamesSearchQuery = "";
    });

    let heartbeatInterval: ReturnType<typeof setInterval> | undefined;

    const detectSWUpdate = async () => {
        const registration = await navigator.serviceWorker.ready;

        registration.addEventListener("updatefound", () => {
            const newSW = registration.installing;
            newSW?.addEventListener("statechange", () => {
                if (newSW.state === "installed") {
                    toast.info(
                        "Une nouvelle version de l'application est disponible. Veuillez recharger la page pour l'appliquer.",
                        {
                            action: {
                                label: "Recharger",
                                onClick: () => {
                                    newSW.postMessage({ type: "SKIP_WAITING" });
                                    window.location.reload();
                                },
                            },
                        },
                    );
                }
            });
        });
    };

    let winnerOverlay: WinnerOverlay;

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

            // MODIFIED: Changed event name to match server-side and added prizeToWinText
            liveServerConnection.connection.off("LotteryWinnerAnnouncement");
            liveServerConnection.connection.on(
                "LotteryWinnerAnnouncement",
                (winningDisplayName: string, prizeText: string, randomGifUrl: string) => {
                    if (winnerOverlay) {
                        // Pass prizeText to showWinner. Adjust showWinner in WinnerOverlay.svelte if necessary.
                        winnerOverlay.showWinner(winningDisplayName, randomGifUrl, undefined, undefined, prizeText);
                    } else {
                        let message = `Le gagnant du tirage au sort est : ${winningDisplayName}`;
                        if (prizeText) {
                            message += ` et remporte : ${prizeText}`;
                        }
                        toast.success(message);
                    }
                },
            );

            if (!global.localGamesFolder) {
                showConfigGamesDirDialog = true;
            }

            //await detectSWUpdate();
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

    let headerEl: HTMLElement | null = null;

    function applyHeaderHeight() {
        if (!headerEl) return;
        const h = headerEl.offsetHeight;
        document.documentElement.style.setProperty("--header-height", `${h}px`);
    }

    onMount(() => {
        applyHeaderHeight();
        const ro = new ResizeObserver(applyHeaderHeight);
        if (headerEl) ro.observe(headerEl);
        window.addEventListener("resize", applyHeaderHeight);
        return () => {
            window.removeEventListener("resize", applyHeaderHeight);
            ro.disconnect();
        };
    });
</script>

<Lights direction="top" class="absolute top-0 h-56 dark:hidden" />
<WinnerOverlay bind:this={winnerOverlay} />

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

<Toaster richColors position="top-center" />
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
        <div class="flex h-screen flex-col overflow-hidden">
            {#if liveServerConnection.connectionState === "Reconnecting" || liveAgentConnection.connectionState === "Reconnecting"}
                <div
                    transition:fly={{ y: -20, duration: 200 }}
                    class="absolute left-1/2 top-0 z-50 mx-auto flex h-auto w-auto -translate-x-1/2 items-center justify-center gap-2 bg-warning px-2 py-1 text-center text-xl shadow-md drop-shadow-md">
                    <TriangleAlert />
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
            <!-- Header with Logo Grid -->
            <div
                id="header"
                bind:this={headerEl}
                class="header-container z-[100] flex h-12 flex-shrink-0 bg-card shadow-sm backdrop-blur dark:shadow-none">
                <!-- Logo Section - aligned with sidebar -->
                <div
                    class="flex items-center justify-center gap-2 border-r border-border bg-card transition-all duration-300 ease-in-out"
                    style:width={global.sidebarCollapsed ? "80px" : "250px"}>
                    <img
                        src="/logo_small.png"
                        alt="Logo"
                        class={cn("h-10 w-auto transition-all duration-300", {
                            "h-8": global.sidebarCollapsed,
                        })} />

                    {#if !global.sidebarCollapsed}
                        <!-- Vertical divided -->
                        <div class="h-8 w-[1px] bg-border" />
                        <NcorpGlitch
                            class="inline-block font-clash text-lg font-semibold tracking-widest"
                            text="LAUNCHER"
                            glitchEnabled={false} />
                        <span class="text-xs text-muted-foreground">v{version}</span>
                    {/if}
                </div>
                <!-- Header Content - spans remaining width -->
                <div class="flex flex-1 items-center border-b px-1">
                    <button
                        onclick={toggleSidebar}
                        class="mr-2 rounded-md p-2 transition-colors hover:bg-muted"
                        title={global.sidebarCollapsed ? "Agrandir le menu" : "Réduire le menu"}>
                        {#if global.sidebarCollapsed}
                            <Menu size={18} />
                        {:else}
                            <ChevronLeft size={18} />
                        {/if}
                    </button>
                    {#if loading || GamesStore.isLoading}
                        <Loader size={24} class="!text-primary" />
                    {/if}
                    <Header class="flex-1" />
                    <div class="ml-auto flex h-full">
                        <!-- Header message -->
                        <HeaderMessage globalSettings={data.globalSettings} />

                        <div class="flex h-full w-auto gap-1 border-l">
                            <div class="flex flex-1 flex-col items-start justify-center">
                                <DropdownMenu.Root>
                                    <DropdownMenu.Trigger class={buttonVariants({ variant: "ghost" })}>
                                        {#if upcomingEvents().length > 0}
                                            {@const firstEvent = upcomingEvents()[0]}
                                            <Tooltip.Root>
                                                <Tooltip.Trigger class="flex items-center gap-2">
                                                    <Calendar class="text-muted-foreground" />
                                                    <div class="flex flex-col items-start">
                                                        <span class="text-sm font-medium">
                                                            {firstEvent.name}
                                                        </span>
                                                        <span class="text-xs text-muted-foreground">
                                                            {formatRelativeTime(firstEvent.start_time)}
                                                        </span>
                                                        <Progress
                                                            value={dayjsUtc(firstEvent.start_time).diff(
                                                                dayjsUtc(),
                                                                "minute",
                                                            )}
                                                            max={dayjsUtc(firstEvent.end_time).diff(
                                                                dayjsUtc(firstEvent.start_time),
                                                                "minute",
                                                            )}
                                                            class="h-1 w-full text-primary-foreground" />
                                                    </div>
                                                    {#if firstEvent.image_url}
                                                        <img
                                                            src={firstEvent.image_url}
                                                            alt={firstEvent.name}
                                                            class="h-10 w-auto object-cover" />
                                                    {/if}
                                                </Tooltip.Trigger>
                                                <Tooltip.Content>
                                                    <p>
                                                        {dayjsUtc(firstEvent.start_time).format("DD/MM/YYYY HH:mm")}
                                                    </p>
                                                </Tooltip.Content>
                                            </Tooltip.Root>
                                        {:else}
                                            <span class="text-sm text-muted-foreground">Aucun événement</span>
                                        {/if}
                                    </DropdownMenu.Trigger>
                                    <DropdownMenu.Content class="z-[110] w-80">
                                        <DropdownMenu.Group>
                                            <DropdownMenu.GroupHeading>Événements à venir</DropdownMenu.GroupHeading>
                                            {#if upcomingEvents().length > 0}
                                                {#each upcomingEvents() as event, i}
                                                    <div in:fly|global={{ x: -20, duration: 200, delay: i * 50 }}>
                                                        <DropdownMenu.Item
                                                            class="cursor-pointer"
                                                            onclick={async () => event.url && (await goto(event.url))}>
                                                            <div class="flex w-full flex-col gap-1">
                                                                <div class="flex items-center justify-between">
                                                                    <span class="font-medium">{event.name}</span>
                                                                    <span class="text-xs text-muted-foreground">
                                                                        {formatRelativeTime(event.start_time)}
                                                                    </span>
                                                                    {#if event.image_url}
                                                                        <img
                                                                            src={event.image_url}
                                                                            alt={event.name}
                                                                            class="h-10 w-auto object-cover" />
                                                                    {/if}
                                                                </div>
                                                                {#if event.description}
                                                                    <span
                                                                        class="line-clamp-2 text-xs text-muted-foreground">
                                                                        {event.description}
                                                                    </span>
                                                                {/if}
                                                                <span class="text-xs text-muted-foreground">
                                                                    {formatDateTime(event.start_time)} - {formatDateTime(
                                                                        event.end_time,
                                                                    )}
                                                                </span>
                                                                <Separator class="my-1" />
                                                            </div>
                                                        </DropdownMenu.Item>
                                                    </div>
                                                {/each}
                                            {:else}
                                                <DropdownMenu.Item disabled>
                                                    <span class="text-muted-foreground">Aucun événement programmé</span>
                                                </DropdownMenu.Item>
                                            {/if}
                                        </DropdownMenu.Group>
                                    </DropdownMenu.Content>
                                </DropdownMenu.Root>
                            </div>
                        </div>

                        <div
                            class="flex h-full w-auto flex-col items-start justify-center border-l pl-2 text-xs text-muted-foreground">
                            <div class="flex w-full items-center justify-between gap-2">
                                <span>Agent</span>
                                <StatusDot
                                    class="static left-0 top-0 m-0 p-0"
                                    status={liveAgentConnection.connectionState} />
                            </div>

                            <div class="flex w-full items-center justify-between gap-2">
                                <span>Serveur</span>
                                <StatusDot
                                    class="static left-0 top-0 m-0 p-0"
                                    status={liveServerConnection.connectionState} />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Header Section - aligned with right sidebar -->
                <div
                    class="flex items-center justify-center border-b bg-card px-4 transition-all duration-300 ease-in-out"
                    class:hidden={rightSidebarHidden}>
                    <ThemSelectorAdvanced />
                </div>
            </div>
            <!-- Main Content Area -->
            <div class="flex flex-1 overflow-hidden">
                <!-- Collapsible Left Sidebar -->
                <aside
                    class="z-[100] flex-shrink-0 overflow-hidden border-border bg-card transition-all duration-300 ease-in-out"
                    style:width={global.sidebarCollapsed ? "80px" : "250px"}>
                    <SideMenu class="h-full">
                        <div class="mt-auto flex w-full">
                            <ProfileDropdown user={user!} />
                        </div>
                    </SideMenu>
                </aside>

                <!-- Main Content -->
                <main class="flex-1 overflow-y-auto overflow-x-hidden p-2">
                    {@render children?.()}
                </main>
                <!-- Right Sidebar - LiveUsers -->
                <aside
                    class="right-sidebar h-full w-68 flex-shrink-0 border-l border-border bg-card transition-all duration-300 ease-in-out"
                    class:hidden={rightSidebarHidden}>
                    <div class="flex h-full flex-col">
                        <LiveUsers class="h-full" />
                        <div class="mt-auto flex items-center justify-center gap-2 border-t py-2">
                            <!-- KoFi Link -->
                            <a
                                href="https://ko-fi.com/keytrap"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="flex items-center gap-2">
                                <img src="/img/kofi.webp" alt="Ko-Fi" class="h-4 w-4" />
                                <span class="text-xs text-muted-foreground">Offrir un kawa au dev ☕</span>
                            </a>
                        </div>
                    </div>
                </aside>
            </div>

            <!-- Footer (placeholder for future use) -->
            <!-- <footer class="bg-card border-t border-border p-2 flex-shrink-0">
                Footer content here
            </footer> -->
        </div>
    </TooltipProvider>
</ThemeProvider>

<style>
    :root {
        /* Fallback (h-12 => 48px) overridden at runtime */
        --header-height: 48px;
    }

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
    .header-container {
        view-transition-name: header;
    }

    .right-sidebar {
        view-transition-name: right-sidebar;
    }
</style>

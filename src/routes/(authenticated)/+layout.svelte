<script lang="ts">
    import "$src/app.css";
    import Header from "$src/lib/components/custom/Header.svelte";
    import { ChevronLeft, ChevronRight, Menu } from "@lucide/svelte";
    import Loader from "$src/lib/components/custom/Loader.svelte";
    import { onDestroy, onMount } from "svelte";
    import * as Tooltip from "$lib/components/ui/tooltip/index.js";
    import "@fontsource-variable/rubik";
    import { fade } from "svelte/transition";
    import { afterNavigate, beforeNavigate, onNavigate } from "$app/navigation";
    import { browser } from "$app/environment";
    import LazyImage from "$src/lib/components/custom/LazyImage.svelte";
    import { Toaster } from "$lib/components/ui/sonner/index.js";
    import { TooltipProvider } from "$src/lib/components/ui/tooltip";
    import { liveServerConnection } from "$src/lib/states/live-server.svelte";
    import { liveUsers } from "$src/lib/states/live-users.svelte";
    import { liveAgentConnection } from "$src/lib/states/live-agent.svelte";
    import ThemeProvider from "$src/lib/components/theme/ThemeProvider.svelte";
    import ThemSelectorAdvanced from "$src/lib/components/theme/ThemSelectorAdvanced.svelte";
    import ConfigGamesDirDialog from "$src/lib/components/layout/ConfigGamesDirDialog.svelte";
    import { SignalREventBinder } from "$src/lib/signalr-events";
    import { GamesStore } from "$src/lib/states/games.svelte";
    import { global } from "$src/lib/states/global.svelte";
    import HeaderBrand from "$src/lib/components/layout/HeaderBrand.svelte";
    import HeaderEventsDropdown from "$src/lib/components/layout/HeaderEventsDropdown.svelte";
    import HeaderInlineStatus from "$src/lib/components/layout/HeaderInlineStatus.svelte";
    import LeftSidebar from "$src/lib/components/layout/LeftSidebar.svelte";
    import RightSidebar from "$src/lib/components/layout/RightSidebar.svelte";
    import dayjs from "dayjs";
    import relativeTime from "dayjs/plugin/relativeTime";
    import utc from "dayjs/plugin/utc";
    import customParseFormat from "dayjs/plugin/customParseFormat";
    import "dayjs/locale/fr";
    import type { LayoutProps } from "./$types";
    import HeaderMessage from "$src/lib/components/custom/HeaderMessage.svelte";
    import { ScrollArea } from "$src/lib/components/ui/scroll-area";
    import { logger } from "better-auth";
    import HeaderAdminControls from "$src/lib/components/layout/HeaderAdminControls.svelte";
    import AdminControlsModal from "$src/lib/components/layout/AdminControlsModal.svelte";
    import WinnerOverlay from "$src/lib/components/custom/WinnerOverlay.svelte";
    import { toast } from "svelte-sonner";
    import ReinstallModal from "$src/lib/components/modals/ReinstallModal.svelte";

    let loading = $state(false);
    let showAdminModal = $state(false);
    let winnerOverlay: WinnerOverlay | undefined = $state();
    // Sidebar visibility handling
    // Right sidebar: preference + responsive override
    let rightSidebarHidden = $state(false); // actual visibility (includes responsive forcing)
    let rightSidebarCollapsedPref = $state(false); // user preference (persisted)
    let isSmallScreen = $state(false); // responsive state (true when < lg)
    // Left sidebar: add user preference (persisted)
    let leftSidebarCollapsedPref = $state(false);
    let { data, children }: LayoutProps = $props(); // Configure dayjs

    dayjs.extend(relativeTime);
    dayjs.extend(utc);
    dayjs.extend(customParseFormat);
    dayjs.locale("fr");

    // Create UTC-first dayjs instance
    const dayjsUtc = (date?: dayjs.ConfigType) => dayjs.utc(date);

    // Auto-collapse sidebars on smaller screens and honor persisted preferences on large screens
    $effect(() => {
        if (typeof window !== "undefined") {
            const handleResize = () => {
                // Breakpoints: md=768, lg=1024
                if (window.innerWidth < 768) {
                    // Always collapse left on small screens
                    global.sidebarCollapsed = true;
                } else if (window.innerWidth >= 1024) {
                    // On large screens, use user preference
                    global.sidebarCollapsed = leftSidebarCollapsedPref;
                } else {
                    // md to lg: keep left sidebar collapsed to save space
                    global.sidebarCollapsed = true;
                }

                // Track small screen for right sidebar logic
                isSmallScreen = window.innerWidth < 1024;
                // On small screens, always hide right sidebar; on large, use user preference
                rightSidebarHidden = isSmallScreen ? true : rightSidebarCollapsedPref;
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
        // Toggle preference and persist; apply immediately when not forced by small screens
        leftSidebarCollapsedPref = !leftSidebarCollapsedPref;
        if (browser) localStorage.setItem("leftSidebarCollapsed", String(leftSidebarCollapsedPref));
        global.sidebarCollapsed = leftSidebarCollapsedPref;
    };

    const toggleRightSidebar = () => {
        // Toggle preference and persist; actual visibility depends on responsive state
        rightSidebarCollapsedPref = !rightSidebarCollapsedPref;
        if (browser) localStorage.setItem("rightSidebarCollapsed", String(rightSidebarCollapsedPref));
        if (!isSmallScreen) {
            rightSidebarHidden = rightSidebarCollapsedPref;
        }
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

    beforeNavigate((event) => {
        if (!event.to) return;

        loading = true;
        global.gamesSearchQuery = "";
    });

    let heartbeatInterval: ReturnType<typeof setInterval> | undefined;

    onMount(async () => {
        if (browser) {
            if (localStorage.getItem("gamesSortOrder")) {
                global.gamesSortOrder = localStorage.getItem("gamesSortOrder") as "asc" | "desc";
            }

            // Load persisted right sidebar preference
            const persistedRight = localStorage.getItem("rightSidebarCollapsed");
            if (persistedRight !== null) {
                rightSidebarCollapsedPref = persistedRight === "true";
            }
            // Load persisted left sidebar preference
            const persistedLeft = localStorage.getItem("leftSidebarCollapsed");
            if (persistedLeft !== null) {
                leftSidebarCollapsedPref = persistedLeft === "true";
            }
            // Apply immediately based on current viewport
            const width = window.innerWidth;
            isSmallScreen = width < 1024;
            rightSidebarHidden = isSmallScreen ? true : rightSidebarCollapsedPref;
            if (width < 768) {
                global.sidebarCollapsed = true;
            } else if (width >= 1024) {
                global.sidebarCollapsed = leftSidebarCollapsedPref;
            } else {
                global.sidebarCollapsed = true;
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
        }
    });

    afterNavigate(() => {
        if (!global.localGamesFolder && location.pathname !== "/my/settings") {
            showConfigGamesDirDialog = true;
        } else {
            showConfigGamesDirDialog = false;
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
</script>

<ConfigGamesDirDialog open={showConfigGamesDirDialog} />

<Toaster richColors position="top-center" />
{#if global.mainBackgroundImage}
    <div in:fade={{ duration: 200, delay: 600 }} out:fade={{ duration: 200 }}>
        <LazyImage
            src={global.mainBackgroundImage}
            alt="Background"
            class="pointer-events-none absolute top-0 -z-10 h-1/4 w-full mask-[linear-gradient(to_bottom,black,transparent)] object-cover opacity-50" />
    </div>
{/if}
<ThemeProvider>
    <TooltipProvider delayDuration={100}>
        <div class="flex h-screen flex-col">
            <!-- Header with Logo Grid -->
            <div
                id="header"
                bind:this={headerEl}
                class="header-container bg-card z-100 flex h-12 shrink-0 shadow-sm backdrop-blur dark:shadow-none">
                <!-- Logo Section - aligned with sidebar -->
                <HeaderBrand />
                <!-- Header Content - spans remaining width -->
                <div class="flex flex-1 items-center border-b px-1">
                    <button
                        onclick={toggleSidebar}
                        class="hover:bg-muted mr-2 rounded-md p-2 transition-colors"
                        title={global.sidebarCollapsed ? "Agrandir le menu" : "Réduire le menu"}>
                        {#if global.sidebarCollapsed}
                            <Menu size={18} />
                        {:else}
                            <ChevronLeft size={18} />
                        {/if}
                    </button>
                    {#if loading || GamesStore.isLoading}
                        <Loader size={24} class="text-primary!" />
                    {/if}
                    <Header class="flex-1" />
                    <div class="ml-auto flex h-full">
                        <!-- Header message -->
                        <HeaderMessage globalSettings={data.globalSettings} />

                        <!-- Admin Controls -->
                        {#if user?.role === "admin"}
                            <HeaderAdminControls onclick={() => showAdminModal = true} />
                        {/if}

                        <HeaderEventsDropdown
                            events={upcomingEvents().map((e) => ({
                                name: e.name,
                                start_time: e.start_time,
                                end_time: e.end_time,
                                description: e.description ?? undefined,
                                image_url: e.image_url ?? undefined,
                                url: e.url ?? undefined,
                            }))} />

                        <HeaderInlineStatus
                            agentState={liveAgentConnection.connectionState}
                            agentVersion={liveAgentConnection.isConnected
                                ? liveAgentConnection.agentVersion
                                : undefined}
                            serverState={liveServerConnection.connectionState} />

                        <!-- Toggle Right Sidebar (always visible, even when sidebar is collapsed) -->
                        <div class="hidden h-full items-center border-l pl-1 lg:flex">
                            <Tooltip.Root>
                                <Tooltip.Trigger>
                                    <button
                                        onclick={toggleRightSidebar}
                                        class="hover:bg-muted rounded-md p-2 transition-colors"
                                        title={rightSidebarHidden
                                            ? "Afficher la liste des membres"
                                            : "Masquer la liste des membres"}>
                                        {#if rightSidebarHidden}
                                            <ChevronLeft size={18} />
                                        {:else}
                                            <ChevronRight size={18} />
                                        {/if}
                                    </button>
                                </Tooltip.Trigger>
                                <Tooltip.Content>
                                    {rightSidebarHidden ? "Afficher les membres" : "Masquer les membres"}
                                </Tooltip.Content>
                            </Tooltip.Root>
                        </div>
                    </div>
                </div>

                <!-- Right Header Section - aligned with right sidebar -->
                <div
                    class="bg-card flex items-center justify-center border-b transition-all duration-300 ease-in-out"
                    class:hidden={rightSidebarHidden}>
                    <ThemSelectorAdvanced />
                </div>
            </div>
            <!-- Main Content Area -->
            <div class="flex min-h-0 flex-1 overflow-hidden">
                <!-- Collapsible Left Sidebar -->
                <LeftSidebar userId={user?.id} />

                <!-- Main Content -->
                <ScrollArea class="min-h-full min-w-0 flex-1 p-2">
                    {@render children?.()}
                </ScrollArea>

                <!-- Right Sidebar - LiveUsers -->
                {#if !rightSidebarHidden}
                    <RightSidebar />
                {/if}
            </div>

            <!-- Footer (placeholder for future use) -->
            <!-- <footer class="bg-card border-t border-border p-2 shrink-0">
                Footer content here
            </footer> -->
        </div>
    </TooltipProvider>
</ThemeProvider>

<!-- Admin Controls Modal -->
{#if user?.role === "admin"}
    <AdminControlsModal bind:open={showAdminModal} />
{/if}

<WinnerOverlay bind:this={winnerOverlay} />

<ReinstallModal />

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

    .left-sidebar {
        view-transition-name: left-sidebar;
    }
</style>

<script lang="ts">
    import ScrollArea from "$src/lib/components/ui/scroll-area/scroll-area.svelte";
    import type { Snippet } from "svelte";
    import SideMenuSubItem from "./SideMenuSubItem.svelte";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import {
        CircleQuestionMark,
        CloudDownload,
        FolderOpen,
        Gamepad2,
        Heart,
        MessageCircle,
        MicVocal,
        PackageOpen,
        PackagePlus,
        RefreshCcwDot,
        Table,
    } from "@lucide/svelte";
    import SideMenuItem from "./SideMenuItem.svelte";
    import { cn, getLocalApi } from "$src/lib/utils";
    import { t } from "$src/lib/translations";
    import Card from "../ui/card/card.svelte";
    import GridPattern from "./GridPattern.svelte";
    import { toast } from "svelte-sonner";
    import { ResponseError } from "$src/lib/api/agent";
    import { goto } from "$app/navigation";
    import SideLinks from "./SideLinks.svelte";
    import AdminMenu from "./AdminMenu.svelte";
    import { page } from "$app/state";
    import { global } from "$src/lib/states/global.svelte";
    import type { User } from "$src/lib/auth/client";
    import { GamesStore } from "$src/lib/states/games.svelte";
    import { PUBLIC_BACKEND_API_URL } from "$env/static/public";
    import { liveAgentConnection } from "$src/lib/states/live-agent.svelte";
    import { Button } from "../ui/button";
    import Separator from "../ui/separator/separator.svelte";
    let { children, class: klazz }: { children?: Snippet; class?: string } = $props();

    const user = page.data["user"] as User;

    const handleStartTeamSpeak = async () => {
        try {
            await getLocalApi().startGame({ gameSlug: "TeamSpeak3" });
        } catch (error) {
            // Check if 404
            if (error instanceof ResponseError) {
                toast.warning("TeamSpeak3 n'est pas installé");
                await goto("/games/TeamSpeak3");
            } else {
                toast.error("Erreur lors du démarrage de TeamSpeak3");
            }
        }
    };

    const handleStartAgent = async () => {
        try {
            window.open("nagent://start", "_self");
            GamesStore.isLoading = false;
        } catch (error) {
            toast.error("Erreur lors du démarrage de l'agent");
        }
    };

    const handleOpenFolder = async () => {
        try {
            await getLocalApi().openGameFolder();
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de l'ouverture du dossier des jeux");
        }
    };
</script>

<aside class={cn("h-full min-h-0 min-w-0", klazz)} aria-label="Sidebar">
    <Card class="relative flex h-full min-h-0 w-auto min-w-0 flex-col gap-0 overflow-hidden border-none py-0">
        <ScrollArea class="min-h-0 min-w-0 flex-1">
            <div class={cn("min-w-0 px-4 py-3", global.sidebarCollapsed && "px-2")}>
                <!-- Added padding for content within ScrollArea -->
                <SideMenuItem
                    showSquareCard={!global.sidebarCollapsed}
                    href="/"
                    label={global.sidebarCollapsed ? "" : $t("home")}
                    collapsed={global.sidebarCollapsed} />
                <!-- Navigation menu items - always visible but adapt to collapsed state -->
                <div class={cn("mt-3 flex flex-col gap-1", global.sidebarCollapsed ? "items-center" : "")}>
                    <SideMenuSubItem
                        icon={Gamepad2}
                        href="/all-games"
                        label={$t("available_games") + ` (${GamesStore.allGames.length})`}
                        iconOnly={global.sidebarCollapsed} />
                    <SideMenuSubItem
                        icon={Heart}
                        href="/favorite-games"
                        label={$t("favorite_games") + ` (${GamesStore.getFavoriteGames().length})`}
                        iconOnly={global.sidebarCollapsed} />
                    <SideMenuSubItem
                        icon={PackageOpen}
                        href="/my-games"
                        label={$t("my_games") + ` (${GamesStore.allGames.filter((g) => g.isInstalled).length})`}
                        iconOnly={global.sidebarCollapsed} />
                    <SideMenuSubItem
                        icon={PackagePlus}
                        href="/recently-added-games"
                        label={$t("recently_added_games") + ` (${GamesStore.recentlyAddedGames.length})`}
                        iconOnly={global.sidebarCollapsed} />
                </div>

                <Separator class={cn("my-3", global.sidebarCollapsed && "mx-2")} />

                <div class={cn("w-auto flex-col gap-1", global.sidebarCollapsed ? "flex items-center" : "flex")}>
                    <SideMenuSubItem
                        icon={MessageCircle}
                        href="/chat"
                        label={$t("chat")}
                        iconOnly={global.sidebarCollapsed} />

                    <SideMenuSubItem
                        icon={MicVocal}
                        onClick={handleStartTeamSpeak}
                        label="Lancer TeamSpeak"
                        iconOnly={global.sidebarCollapsed} />
                    <SideMenuSubItem
                        icon={CloudDownload}
                        href="https://dl.n-lan.com/agent/updates/NCorp.Agent-win-Setup.exe"
                        label="Télécharger l'agent"
                        iconOnly={global.sidebarCollapsed} />

                    <SideMenuSubItem
                        href="/table-plans"
                        label="Plan de salle"
                        icon={Table}
                        iconOnly={global.sidebarCollapsed} />

                    {#if liveAgentConnection.isConnected === false}
                        <SideMenuSubItem
                            icon="{PUBLIC_BACKEND_API_URL}/resources/agent_icon.ico"
                            label="Lancer l'agent"
                            onClick={handleStartAgent}
                            iconOnly={global.sidebarCollapsed} />
                    {/if}

                    <SideMenuSubItem
                        icon={CircleQuestionMark}
                        href="/faq"
                        label="FAQ"
                        iconOnly={global.sidebarCollapsed} />
                </div>

                <!-- Side Links and Admin Menu - always visible but adapt to collapsed state -->
                <div class={cn("mt-3 w-auto flex-col", global.sidebarCollapsed ? "flex items-center gap-1" : "flex gap-0")}>
                    <!-- Side Links Component -->
                    <SideLinks />

                    {#if user?.role?.includes("admin")}
                        <div
                            class={cn(
                                "dark:bg-background-dark relative flex h-auto w-auto flex-col rounded-lg antialiased gap-1",
                                global.sidebarCollapsed ? "items-center" : "items-center px-4",
                            )}>
                            <!-- <BackgroundBeams /> -->
                            {#if !global.sidebarCollapsed}
                                <SideMenuItem class="mr-auto text-2xl">{$t("admin_menu")}</SideMenuItem>
                            {/if}
                            <AdminMenu />
                        </div>
                    {/if}

                    <SideMenuItem
                        label="Actions rapides"
                        class={global.sidebarCollapsed ? "truncate text-xs text-wrap text-ellipsis" : ""} />

                    <div
                        class={cn(
                            "flex flex-col gap-1",
                            global.sidebarCollapsed ? "items-center" : "text-base",
                        )}>
                        {#if global.sidebarCollapsed}
                            <Tooltip.Root>
                                <Tooltip.Trigger>
                                    <Button size="icon" variant="outline" onclick={handleOpenFolder} class="h-8 w-8">
                                        <FolderOpen class="h-4 w-4" />
                                    </Button>
                                </Tooltip.Trigger>
                                <Tooltip.Content side="right">
                                    <p>Ouvrir le dossier des jeux</p>
                                </Tooltip.Content>
                            </Tooltip.Root>
                        {:else}
                            <Button variant="outline" onclick={handleOpenFolder}>
                                <FolderOpen />
                                <span class="ml-2">Ouvrir le dossier des jeux</span>
                            </Button>
                        {/if}
                    </div>
                </div>
            </div>
        </ScrollArea>
        {#if children}
            <hr class="mt-auto" />
            <div class={cn("px-4 py-3", global.sidebarCollapsed && "px-2")}>
                {@render children?.()}
            </div>
        {/if}
        <GridPattern
            width={20}
            height={20}
            strokeDashArray="4 2"
            fillColor="rgb(156 163 175 / 0.1)"
            class={cn(
                "pointer-events-none absolute inset-0",
                "mask-[radial-gradient(150px_circle_at_center,white,transparent)]",
            )} />
    </Card>
</aside>

<style>
    aside {
        view-transition-name: aside;
    }
</style>

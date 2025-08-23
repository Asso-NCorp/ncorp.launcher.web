<script lang="ts">
    import ScrollArea from "$src/lib/components/ui/scroll-area/scroll-area.svelte";
    import type { Snippet } from "svelte";
    import SideMenuSubItem from "./SideMenuSubItem.svelte";
    import {
        CloudLightning,
        DownloadCloud,
        FolderOpen,
        Gamepad2,
        MicVocal,
        PackageOpen,
        PackagePlus,
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
</script>

<aside class="h-full min-w-0">
    <Card class={cn("relative flex h-full w-auto min-w-0 flex-col border-y-0", klazz)}>
        <ScrollArea class="min-w-0 flex-1">
            <div class={cn("min-w-0 p-4", global.sidebarCollapsed && "p-2")}>
                <!-- Added padding for content within ScrollArea -->
                <SideMenuItem
                    showSquareCard={!global.sidebarCollapsed}
                    href="/"
                    label={global.sidebarCollapsed ? "" : $t("home")}
                    collapsed={global.sidebarCollapsed} />
                <!-- Navigation menu items - always visible but adapt to collapsed state -->
                <div class={cn("flex flex-col", global.sidebarCollapsed ? "items-center space-y-3" : "space-y-0")}>
                    <SideMenuSubItem
                        icon={Gamepad2}
                        class={global.sidebarCollapsed ? "p-2" : "pt-3"}
                        href="/all-games"
                        label={$t("available_games") + ` (${GamesStore.allGames.length})`}
                        iconOnly={global.sidebarCollapsed} />
                    <SideMenuSubItem
                        icon={PackageOpen}
                        class={global.sidebarCollapsed ? "p-2" : "pt-3"}
                        href="/my-games"
                        label={$t("my_games") + ` (${GamesStore.installedGames.length})`}
                        iconOnly={global.sidebarCollapsed} />
                    <SideMenuSubItem
                        icon={PackagePlus}
                        class={global.sidebarCollapsed ? "p-2" : "pt-3"}
                        href="/recently-added-games"
                        label={$t("recently_added_games")}
                        iconOnly={global.sidebarCollapsed} />
                    <SideMenuSubItem
                        icon={MicVocal}
                        class={global.sidebarCollapsed ? "p-2" : "pt-3"}
                        onClick={handleStartTeamSpeak}
                        label="Lancer TeamSpeak"
                        iconOnly={global.sidebarCollapsed} />
                    <SideMenuSubItem
                        icon={DownloadCloud}
                        class={global.sidebarCollapsed ? "p-2" : "pt-3"}
                        href="https://dl.n-lan.com/agent/updates/NCorp.Agent-win-Setup.exe"
                        label="Télécharger l'agent"
                        iconOnly={global.sidebarCollapsed} />
                </div>

                <!-- Side Links and Admin Menu - always visible but adapt to collapsed state -->
                <div class={cn("mt-5 w-auto flex-col gap-2", global.sidebarCollapsed ? "flex items-center" : "flex")}>
                    <!-- Side Links Component -->
                    <SideLinks />

                    {#if user?.role?.includes("admin")}
                        <div
                            class={cn(
                                "relative flex h-auto w-auto flex-col rounded-lg antialiased dark:bg-background-dark",
                                global.sidebarCollapsed ? "items-center" : "items-center p-4",
                            )}>
                            <!-- <BackgroundBeams /> -->
                            {#if !global.sidebarCollapsed}
                                <SideMenuItem class="mr-auto text-2xl">{$t("admin_menu")}</SideMenuItem>
                            {/if}
                            <AdminMenu />
                        </div>
                    {/if}
                </div>
            </div>
        </ScrollArea>
        {#if children}
            <hr />
            <div class={cn("p-2", global.sidebarCollapsed && "px-1")}>
                {@render children?.()}
            </div>
        {/if}
        <GridPattern
            width={20}
            height={20}
            strokeDashArray="4 2"
            fillColor="rgb(156 163 175 / 0.1)"
            class={cn("absolute top-0", "[mask-image:radial-gradient(150px_circle_at_center,white,transparent)]")} />
    </Card>
</aside>

<style>
    aside {
        view-transition-name: aside;
    }
</style>

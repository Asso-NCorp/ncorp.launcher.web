<script lang="ts">
    import ScrollArea from "$src/lib/components/ui/scroll-area/scroll-area.svelte";
    import type { Snippet } from "svelte";
    import SideMenuSubItem from "./SideMenuSubItem.svelte";
    import { CloudLightning, DownloadCloud, FolderOpen, Gamepad2, MicVocal } from "@lucide/svelte";
    import SideMenuItem from "./SideMenuItem.svelte";
    import { cn, getLocalApi } from "$src/lib/utils";
    import { t } from "$src/lib/translations";
    import Card from "../ui/card/card.svelte";
    import GridPattern from "./GridPattern.svelte";
    import { GamesStore } from "$src/lib/stores/games.svelte";
    import { toast } from "svelte-sonner";
    import { ResponseError } from "$src/lib/api/agent";
    import { goto } from "$app/navigation";
    import SideLinks from "./SideLinks.svelte";
    import AdminMenu from "./AdminMenu.svelte";
    import { page } from "$app/state";
    import type { PageData } from "../../../routes/(authenticated)/$types";
    import type { User } from "$src/lib/auth/client";
    let {
        children,
        class: klazz,
        sidebarCollapsed = false,
    }: { children?: Snippet; class?: string; sidebarCollapsed?: boolean } = $props();

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
            <div class={cn("min-w-0 p-4", sidebarCollapsed && "p-2")}>
                <!-- Added padding for content within ScrollArea -->
                <SideMenuItem
                    showSquareCard={!sidebarCollapsed}
                    href="/"
                    label={sidebarCollapsed ? "" : $t("home")}
                    collapsed={sidebarCollapsed} />

                {#if !sidebarCollapsed}
                    <SideMenuSubItem
                        icon={Gamepad2}
                        class="pl-3 pt-3"
                        href="/all-games"
                        label={$t("available_games")} />
                    <SideMenuSubItem icon={FolderOpen} class="pl-3 pt-3" href="/my-games" label={$t("my_games")} />
                    <SideMenuSubItem
                        icon={CloudLightning}
                        class="pl-3 pt-3"
                        href="/small-games"
                        label={$t("max_10gb_games")} />

                    <SideMenuSubItem
                        icon={MicVocal}
                        class="pl-3 pt-3"
                        onClick={handleStartTeamSpeak}
                        label="Lancer TeamSpeak" />
                    <SideMenuSubItem
                        icon={DownloadCloud}
                        class="pl-3 pt-3"
                        href="https://dl.n-lan.com/agent/updates/NCorp.Agent-win-Setup.exe"
                        label="Télécharger l'agent" />

                    <div class="mt-5 hidden w-auto flex-col gap-2 lg:flex">
                        <!-- Side Links Component -->
                        <SideLinks />

                        {#if user?.role?.includes("admin")}
                            <div
                                class="relative flex h-auto w-auto flex-col items-center rounded-lg p-4 antialiased dark:bg-background-dark">
                                <!-- <BackgroundBeams /> -->
                                <SideMenuItem class="mr-auto text-2xl">{$t("admin_menu")}</SideMenuItem>
                                <AdminMenu />
                            </div>
                        {/if}
                    </div>
                {:else}
                    <!-- Collapsed state icons only -->
                    <div class="flex flex-col items-center space-y-3">
                        <SideMenuSubItem
                            icon={Gamepad2}
                            class="p-2"
                            href="/all-games"
                            label={$t("available_games")}
                            iconOnly />
                        <SideMenuSubItem
                            icon={FolderOpen}
                            class="p-2"
                            href="/my-games"
                            label={$t("my_games")}
                            iconOnly />
                        <SideMenuSubItem
                            icon={CloudLightning}
                            class="p-2"
                            href="/small-games"
                            label={$t("max_10gb_games")}
                            iconOnly />
                        <SideMenuSubItem
                            icon={MicVocal}
                            class="p-2"
                            onClick={handleStartTeamSpeak}
                            label="Lancer TeamSpeak"
                            iconOnly />
                        <SideMenuSubItem
                            icon={DownloadCloud}
                            class="p-2"
                            href="https://dl.n-lan.com/agent/updates/NCorp.Agent-win-Setup.exe"
                            label="Télécharger l'agent"
                            iconOnly />
                    </div>
                {/if}
            </div>
        </ScrollArea>
        {#if children}
            <hr />
            <div class={cn("p-2", sidebarCollapsed && "px-1")}>
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

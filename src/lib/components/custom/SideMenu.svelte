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
    let { children, class: klazz }: { children?: Snippet; class?: string } = $props();

    const user = page.data["user"] as User;

    const handleStartTeamSpeak = async () => {
        try {
            await getLocalApi().startGame({ gameSlug: "TeamSpeak3", notify: false });
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

<aside class="h-full">
    <Card class={cn("relative flex h-full w-auto flex-col border-y-0", klazz)}>
        <ScrollArea class="flex-1">
            <div class="p-4">
                <!-- Added padding for content within ScrollArea -->
                <SideMenuItem showSquareCard href="/" label={$t("home")} />
                <!-- <SideMenuItem showSquareCard href="/chat" label="Chat" /> -->
                <!-- <SideMenuItem showSquareCard href="/chat/general" label="Hub" /> -->
                <!-- <SideMenuItem showSquareCard href="/chat/vocal" label="Voice" badge="beta" /> -->

                <SideMenuSubItem icon={Gamepad2} class="pl-3 pt-3" href="/all-games" label={$t("available_games")} />
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
            </div>
        </ScrollArea>
        {#if children}
            <hr />
            <div class="p-2">
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

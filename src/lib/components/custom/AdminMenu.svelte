<script lang="ts">
    import type { Snippet } from "svelte";
    import SideMenuItem from "./SideMenuItem.svelte";
    import { cn, getLocalApi, getServerApi } from "$src/lib/utils";
    import SideMenuSubItem from "./SideMenuSubItem.svelte";
    import { FerrisWheel, FolderOpen, Link, List, PlusIcon, RefreshCcwDot, Settings2, Users } from "@lucide/svelte";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import { t } from "$src/lib/translations";
    import { Button } from "../ui/button";
    import { toast } from "svelte-sonner";
    import { Card } from "../ui/card";
    import { global } from "$src/lib/states/global.svelte";
    let { children, class: klazz }: { children?: Snippet; class?: string } = $props();

    let refreshing = $state(false);
    const handleRefresh = async () => {
        try {
            refreshing = true;
            await getServerApi().refreshGames();
            toast.success("Liste des jeux rafraîchie avec succès");
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors du rafraîchissement de la liste des jeux");
        } finally {
            refreshing = false;
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

<div class={cn("flex w-auto flex-col", global.sidebarCollapsed ? "items-center space-y-3" : "space-y-0", klazz)}>
    <SideMenuSubItem
        href="/admin/manage-games"
        label={$t("manage_games")}
        class={global.sidebarCollapsed ? "p-2" : "pt-3"}
        icon={Settings2}
        iconOnly={global.sidebarCollapsed} />
    <SideMenuSubItem
        href="/admin/manage-users"
        label={$t("users_management")}
        class={global.sidebarCollapsed ? "p-2" : "pt-3"}
        icon={Users}
        iconOnly={global.sidebarCollapsed} />
    <SideMenuSubItem
        href="/admin/manage-sidelinks"
        label={$t("links_management")}
        class={global.sidebarCollapsed ? "p-2" : "pt-3"}
        icon={Link}
        iconOnly={global.sidebarCollapsed} />
    <SideMenuSubItem
        href="/admin/lottery"
        label="Loterie"
        class={global.sidebarCollapsed ? "p-2" : "pt-3"}
        icon={FerrisWheel}
        iconOnly={global.sidebarCollapsed} />
    <!-- Actions section - always visible but adapts to collapsed state -->
    {#if !global.sidebarCollapsed}
        <SideMenuItem label="Actions rapides" class="mt-5" />
    {/if}

    <div class={cn("mt-5 flex flex-col gap-1", global.sidebarCollapsed ? "items-center space-y-2" : "text-base")}>
        {#if global.sidebarCollapsed}
            <!-- Collapsed: icon-only buttons with tooltips -->
            <Tooltip.Root>
                <Tooltip.Trigger>
                    <Button size="icon" disabled={refreshing} variant="outline" onclick={handleRefresh} class="h-8 w-8">
                        <RefreshCcwDot class={cn("h-4 w-4", refreshing && "animate-spin")} />
                    </Button>
                </Tooltip.Trigger>
                <Tooltip.Content side="right">
                    <p>Rafraîchir les jeux</p>
                </Tooltip.Content>
            </Tooltip.Root>

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
            <!-- Expanded: full layout -->
            <Tooltip.Root>
                <Tooltip.Trigger>
                    <div class="flex w-full">
                        <Card class="flex items-center justify-center bg-secondary text-primary shadow-sm">
                            <span class="block origin-center -rotate-90 transform text-xs">ADM</span>
                        </Card>

                        <Button class="flex-1" disabled={refreshing} variant="outline" onclick={handleRefresh}>
                            <RefreshCcwDot class={refreshing ? "animate-spin" : ""} />
                            <span class="ml-2">Rafraîchir les jeux</span>
                        </Button>
                    </div>
                </Tooltip.Trigger>
                <Tooltip.Content>
                    <p>
                        Reconstruire la liste des jeux <br />
                        du serveur. Cela peut
                        <br />
                        prendre un certain temps.
                    </p>
                </Tooltip.Content>
            </Tooltip.Root>
            <Button variant="outline" onclick={handleOpenFolder}>
                <FolderOpen />
                <span class="ml-2">Ouvrir le dossier des jeux</span>
            </Button>
        {/if}
    </div>
    {@render children?.()}
</div>

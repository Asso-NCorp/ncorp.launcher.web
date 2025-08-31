<script lang="ts">
    import type { Snippet } from "svelte";
    import SideMenuItem from "./SideMenuItem.svelte";
    import { cn, getLocalApi, getServerApi } from "$src/lib/utils";
    import SideMenuSubItem from "./SideMenuSubItem.svelte";
    import {
        FerrisWheel,
        FolderOpen,
        Link,
        List,
        PlusIcon,
        RefreshCcwDot,
        Settings2,
        Star,
        Users,
    } from "@lucide/svelte";
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

   
</script>

<div class={cn("flex w-auto flex-col", global.sidebarCollapsed ? "items-center space-y-3" : "space-y-0", klazz)}>
    <SideMenuSubItem
        href="/admin/manage-games"
        label={$t("manage_games")}
        class={global.sidebarCollapsed ? "p-2" : "pt-3"}
        icon={Settings2}
        iconOnly={global.sidebarCollapsed} />
    <SideMenuSubItem
        href="/admin/manage-games/featured"
        label={$t("featured_games")}
        class={global.sidebarCollapsed ? "p-2" : "pt-3"}
        icon={Star}
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
            
        {/if}
    </div>
    {@render children?.()}
</div>

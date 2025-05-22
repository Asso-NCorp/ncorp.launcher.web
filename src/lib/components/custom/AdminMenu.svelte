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

<div class={cn("flex w-auto flex-col", klazz)}>
    <SideMenuSubItem href="/admin/manage-games" label={$t("manage_games")} class="mb-3 pb-0" icon={Settings2} />
    <SideMenuSubItem href="/admin/manage-users" label={$t("users_management")} class="mb-3 pb-0" icon={Users} />
    <SideMenuSubItem href="/admin/manage-sidelinks" label={$t("links_management")} class="mb-3 pb-0" icon={Link} />
    <SideMenuSubItem href="/admin/lottery" label="Lotterie" class="mb-3 pb-0" icon={FerrisWheel} />
    <SideMenuItem label="Actions rapides" class="mt-5" />
    <div class="flex flex-col gap-1 text-base">
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
    </div>
    {@render children?.()}
</div>

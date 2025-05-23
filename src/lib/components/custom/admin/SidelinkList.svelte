<script lang="ts">
    import { Skeleton } from "$lib/components/ui/skeleton";
    import * as Table from "$lib/components/ui/table/index.js";
    import { Link } from "@lucide/svelte";
    import Button from "../../ui/button/button.svelte";
    import * as Popover from "$lib/components/ui/popover/index.js";
    import { toast } from "svelte-sonner";
    import type { sidelink } from "@prisma/client";
    import { Checkbox } from "../../ui/checkbox";
    import { global } from "$lib/states/global.svelte";
    import { cn } from "$lib/utils";

    interface SidelinkListProps {
        loading: boolean;
        sidelinks: sidelink[];
        onSelect: (sidelink: sidelink) => void;
        onDelete: (sidelink: sidelink) => Promise<void>;
    }

    const { loading, sidelinks, onSelect, onDelete }: SidelinkListProps = $props();

    // Create a map to track open state of each popover
    let popoverStates: Record<number, boolean> = {};

    // Initialize popover states for each sidelink
    $effect(() => {
        if (sidelinks && sidelinks.length > 0) {
            const newStates: Record<number, boolean> = {};
            sidelinks.forEach((link: sidelink) => {
                // Initialize each popover as closed
                newStates[link.id] = false;
            });
            popoverStates = newStates;
        }
    });

    // Function to close a specific popover
    function closePopover(sidelinkId: number) {
        popoverStates[sidelinkId] = false;
    }

    const handleDelete = async (sidelink: sidelink) => {
        try {
            await onDelete(sidelink);

            // Close the popover after successful deletion
            closePopover(sidelink.id);

            // Show success message
            toast.success("Lien supprimé avec succès", {
                class: "bg-green-500",
            });
        } catch (error) {
            console.error("Error deleting sidelink:", error);
            toast.error("Erreur lors de la suppression du lien", {
                class: "bg-red-500",
            });
        }
    };
</script>

<div class="h-full w-full">
    {#if loading}
        <Skeleton />
    {:else}
        <span class={cn("block", global.sidebarCollapsed && "text-sm")}>
            {global.sidebarCollapsed ? "Liens" : "Sélectionnez un lien"}
        </span>
        <Table.Root class={cn("", global.sidebarCollapsed && "text-sm")}>
            <Table.Header>
                <Table.Row>
                    <Table.Head class="w-10"></Table.Head>
                    <Table.Head class={cn("", global.sidebarCollapsed && "text-xs")}>Nom</Table.Head>
                    <Table.Head class={cn("", global.sidebarCollapsed && "hidden text-xs md:table-cell")}>
                        URL
                    </Table.Head>
                    <Table.Head class={cn("", global.sidebarCollapsed && "hidden text-xs lg:table-cell")}>
                        Caché
                    </Table.Head>
                    <Table.Head class="text-right"></Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#each sidelinks as sidelink (sidelink.id)}
                    <Table.Row class="cursor-pointer" onclick={() => onSelect(sidelink)}>
                        <Table.Cell>
                            <Link class={cn("size-5", global.sidebarCollapsed && "size-4")} />
                        </Table.Cell>
                        <Table.Cell class={cn("font-medium", global.sidebarCollapsed && "text-xs")}>
                            {global.sidebarCollapsed
                                ? sidelink.name.length > 10
                                    ? sidelink.name.substring(0, 10) + "..."
                                    : sidelink.name
                                : sidelink.name}
                        </Table.Cell>
                        <Table.Cell class={cn("", global.sidebarCollapsed && "hidden text-xs md:table-cell")}>
                            {global.sidebarCollapsed
                                ? sidelink.url.length > 15
                                    ? sidelink.url.substring(0, 15) + "..."
                                    : sidelink.url
                                : sidelink.url}
                        </Table.Cell>
                        <Table.Cell class={cn("font-medium", global.sidebarCollapsed && "hidden lg:table-cell")}>
                            <Checkbox checked={sidelink.hidden} inert />
                        </Table.Cell>
                        <Table.Cell class="text-right">
                            <Popover.Root
                                open={popoverStates[sidelink.id] === true}
                                onOpenChange={(isOpen) => {
                                    popoverStates[sidelink.id] = isOpen;
                                }}>
                                <Popover.Trigger class="text-destructive-foreground">
                                    <Button variant="outline" size={global.sidebarCollapsed ? "sm" : "default"}>
                                        {global.sidebarCollapsed ? "×" : "Supprimer"}
                                    </Button>
                                </Popover.Trigger>
                                <Popover.Content>
                                    <div class="flex flex-col gap-2">
                                        <span class={cn("", global.sidebarCollapsed && "text-sm")}>
                                            Êtes-vous sûr ?
                                        </span>
                                        <span class={cn("", global.sidebarCollapsed && "text-xs")}>
                                            Cette action est irréversible.
                                        </span>
                                        <div class="flex gap-2">
                                            <Popover.Close>
                                                <Button
                                                    variant="outline"
                                                    size={global.sidebarCollapsed ? "sm" : "default"}
                                                    onclick={() => closePopover(sidelink.id)}>
                                                    {global.sidebarCollapsed ? "×" : "Annuler"}
                                                </Button>
                                            </Popover.Close>
                                            <Button
                                                variant="destructive"
                                                size={global.sidebarCollapsed ? "sm" : "default"}
                                                onclick={() => handleDelete(sidelink)}>
                                                {global.sidebarCollapsed ? "✓" : "Supprimer"}
                                            </Button>
                                        </div>
                                    </div>
                                </Popover.Content>
                            </Popover.Root>
                        </Table.Cell>
                    </Table.Row>
                {/each}
            </Table.Body>
        </Table.Root>
    {/if}
</div>

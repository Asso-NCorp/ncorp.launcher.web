<script lang="ts">
    import { Skeleton } from "$lib/components/ui/skeleton";
    import * as Table from "$lib/components/ui/table/index.js";
    import { Link } from "@lucide/svelte";
    import Button from "../../ui/button/button.svelte";
    import * as Popover from "$lib/components/ui/popover/index.js";
    import { toast } from "svelte-sonner";
    import type { sidelink } from "@prisma/client";
    import { Checkbox } from "../../ui/checkbox";

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
        <span>Sélectionnez un lien</span>
        <Table.Root>
            <Table.Header>
                <Table.Row>
                    <Table.Head class="w-10"></Table.Head>
                    <Table.Head>Nom</Table.Head>
                    <Table.Head>URL</Table.Head>
                    <Table.Head>Caché</Table.Head>
                    <Table.Head class="text-right"></Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#each sidelinks as sidelink (sidelink.id)}
                    <Table.Row class="cursor-pointer" onclick={() => onSelect(sidelink)}>
                        <Table.Cell>
                            <Link class="size-5" />
                        </Table.Cell>
                        <Table.Cell class="font-medium">{sidelink.name}</Table.Cell>
                        <Table.Cell>{sidelink.url}</Table.Cell>
                        <Table.Cell class="font-medium">
                            <Checkbox checked={sidelink.hidden} inert />
                        </Table.Cell>
                        <Table.Cell class="text-right">
                            <Popover.Root
                                open={popoverStates[sidelink.id] === true}
                                onOpenChange={(isOpen) => {
                                    popoverStates[sidelink.id] = isOpen;
                                }}>
                                <Popover.Trigger class="text-destructive-foreground">
                                    <Button variant="outline">Supprimer</Button>
                                </Popover.Trigger>
                                <Popover.Content>
                                    <div class="flex flex-col gap-2">
                                        <span>Êtes-vous sûr ?</span>
                                        <span>Cette action est irréversible.</span>
                                        <div class="flex gap-2">
                                            <Popover.Close>
                                                <Button variant="outline" onclick={() => closePopover(sidelink.id)}>
                                                    Annuler
                                                </Button>
                                            </Popover.Close>
                                            <Button variant="destructive" onclick={() => handleDelete(sidelink)}>
                                                Supprimer
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

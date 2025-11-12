<script lang="ts">
    import { Skeleton } from "$lib/components/ui/skeleton";
    import * as Table from "$lib/components/ui/table/index.js";
    import { Server, Trash2, Activity } from "@lucide/svelte";
    import Button from "../../ui/button/button.svelte";
    import * as Popover from "$lib/components/ui/popover/index.js";
    import { toast } from "svelte-sonner";
    import type { game_server } from "@prisma/client";
    import { Checkbox } from "../../ui/checkbox";
    import { cn } from "$lib/utils";
    import { Badge } from "$lib/components/ui/badge";

    interface GameServerListProps {
        loading: boolean;
        gameServers: game_server[];
        onSelect: (gameServer: game_server) => void;
        onDelete: (gameServer: game_server) => Promise<void>;
    }

    const { loading, gameServers, onSelect, onDelete }: GameServerListProps = $props();

    // Create a map to track open state of each popover
    let popoverStates: Record<number, boolean> = {};

    // Initialize popover states for each game server
    $effect(() => {
        if (gameServers && gameServers.length > 0) {
            const newStates: Record<number, boolean> = {};
            gameServers.forEach((server: game_server) => {
                // Initialize each popover as closed
                newStates[server.id] = false;
            });
            popoverStates = newStates;
        }
    });

    // Function to close a specific popover
    function closePopover(serverId: number) {
        popoverStates[serverId] = false;
    }

    const handleDelete = async (gameServer: game_server) => {
        try {
            await onDelete(gameServer);

            // Close the popover after successful deletion
            closePopover(gameServer.id);

            // Show success message
            toast.success("Serveur supprimé avec succès", {
                class: "bg-green-500",
            });
        } catch (error) {
            console.error("Error deleting game server:", error);
            toast.error("Erreur lors de la suppression du serveur", {
                class: "bg-red-500",
            });
        }
    };

    // Format date for display
    function formatDate(date: Date | null): string {
        if (!date) return "Jamais";
        return new Date(date).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }
</script>

<div class="flex h-full w-full flex-col">
    {#if loading}
        <Skeleton />
    {:else}
        <Table.Root>
            <Table.Header class="bg-muted/30">
                <Table.Row>
                    <Table.Head class="w-12"></Table.Head>
                    <Table.Head class="w-[200px]">Nom</Table.Head>
                    <Table.Head class="w-[180px]">Jeu</Table.Head>
                    <Table.Head class="w-20 text-center">Type</Table.Head>
                    <Table.Head class="w-24 text-center">Port</Table.Head>
                    <Table.Head class="hidden w-28 text-center lg:table-cell">Monitor</Table.Head>
                    <Table.Head class="hidden w-[180px] xl:table-cell">Dernière détection</Table.Head>
                    <Table.Head class="w-20 text-right"></Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#each gameServers as server (server.id)}
                    <Table.Row
                        class="hover:bg-muted/50 group cursor-pointer transition-colors"
                        onclick={() => onSelect(server)}>
                        <Table.Cell class="w-12">
                            <Server class="size-5" />
                        </Table.Cell>
                        <Table.Cell class="w-[200px] font-medium">
                            <div class="flex flex-col gap-0.5">
                                <span class="truncate">{server.name}</span>
                                {#if server.description}
                                    <span class="text-muted-foreground truncate text-xs">
                                        {server.description}
                                    </span>
                                {/if}
                            </div>
                        </Table.Cell>
                        <Table.Cell class="w-[180px]">
                            <div class="flex flex-col gap-0.5">
                                <span class="truncate text-sm">{server.game_title}</span>
                                <span class="text-muted-foreground truncate text-xs">{server.game_slug}</span>
                            </div>
                        </Table.Cell>
                        <Table.Cell class="w-20 text-center">
                            <Badge variant={server.type === "tcp" ? "default" : "secondary"}>
                                {server.type.toUpperCase()}
                            </Badge>
                        </Table.Cell>
                        <Table.Cell class="w-24 text-center font-mono text-sm">
                            {server.port}
                        </Table.Cell>
                        <Table.Cell class="hidden w-28 text-center lg:table-cell">
                            <div class="flex items-center justify-center gap-2">
                                {#if server.monitor}
                                    <Activity class="size-4 text-green-500" />
                                {/if}
                                <Checkbox checked={server.monitor} inert />
                            </div>
                        </Table.Cell>
                        <Table.Cell class="text-muted-foreground hidden w-[180px] text-sm xl:table-cell">
                            {formatDate(server.last_detection_at)}
                        </Table.Cell>
                        <Table.Cell class="w-20 text-right">
                            <Popover.Root
                                open={popoverStates[server.id] === true}
                                onOpenChange={(isOpen) => {
                                    popoverStates[server.id] = isOpen;
                                }}>
                                <Popover.Trigger class="text-destructive-foreground">
                                    <button
                                        type="button"
                                        class="text-destructive hover:bg-destructive/10 inline-flex items-center justify-center rounded px-2 py-1 text-xs font-medium transition-colors"
                                        title="Supprimer ce serveur">
                                        <Trash2 class="size-4" />
                                    </button>
                                </Popover.Trigger>
                                <Popover.Content>
                                    <div class="flex flex-col gap-3">
                                        <div>
                                            <span class="block font-semibold">Êtes-vous sûr ?</span>
                                            <span class="text-muted-foreground text-sm">
                                                Cette action est irréversible.
                                            </span>
                                        </div>
                                        <div class="flex justify-end gap-2">
                                            <Popover.Close>
                                                <Button
                                                    variant="outline"
                                                    size="default"
                                                    onclick={() => closePopover(server.id)}>
                                                    Annuler
                                                </Button>
                                            </Popover.Close>
                                            <Button
                                                variant="destructive"
                                                size="default"
                                                onclick={() => handleDelete(server)}>
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

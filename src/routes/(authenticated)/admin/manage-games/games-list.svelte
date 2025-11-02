<script lang="ts">
    import { Skeleton } from "$src/lib/components/ui/skeleton";
    import { GamesStore } from "$src/lib/states/games.svelte";
    import type { InstallableGame } from "$src/lib/shared-models";
    import * as Table from "$lib/components/ui/table/index.js";
    import * as Popover from "$lib/components/ui/popover/index.js";
    import Button from "$lib/components/ui/button/button.svelte";
    import { buttonVariants } from "$lib/components/ui/button/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Trash2 } from "@lucide/svelte";
    import { PUBLIC_MEDIAS_URL } from "$env/static/public";
    import { toast } from "svelte-sonner";
    import { Skeleton as SkeletonLoader } from "$src/lib/components/ui/skeleton";
    import { cn } from "$lib/utils";

    let { gameSelected, onDelete }: { gameSelected: (game: InstallableGame) => void; onDelete?: (game: InstallableGame) => Promise<void> } = $props();

    const games = $derived(GamesStore.games || []);
    let searchQuery = $state("");

    const filteredGames = $derived(
        games.filter((game) =>
            game.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            game.folderSlug?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    let popoverStates: Record<string, boolean> = {};

    $effect(() => {
        if (games && games.length > 0) {
            const newStates: Record<string, boolean> = {};
            games.forEach((game: InstallableGame) => {
                if (game.folderSlug) {
                    newStates[game.folderSlug] = false;
                }
            });
            popoverStates = newStates;
        }
    });

    function closePopover(folderSlug: string | undefined) {
        if (folderSlug) {
            popoverStates[folderSlug] = false;
        }
    }

    const handleDelete = async (game: InstallableGame) => {
        try {
            if (game.folderSlug) {
                // Use the default delete from GamesStore if no custom onDelete provided
                if (onDelete) {
                    await onDelete(game);
                } else {
                    GamesStore.deleteGame(game.folderSlug);
                }
                closePopover(game.folderSlug);
            }
            toast.success("Jeu supprimé avec succès", {
                class: "bg-green-500",
            });
        } catch (error) {
            console.error("Error deleting game:", error);
            toast.error("Erreur lors de la suppression du jeu", {
                class: "bg-red-500",
            });
        }
    };
</script>

{#if GamesStore.isLoading}
    <div class="flex items-center justify-center py-8">
        <SkeletonLoader />
    </div>
{:else}
    <div class="h-full w-full flex flex-col overflow-hidden space-y-4">
        <!-- Search Bar -->
        <div class="shrink-0 flex justify-center">
            <Input
                type="text"
                placeholder="Rechercher un jeu..."
                bind:value={searchQuery}
                class="w-1/2"
            />
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto">
            <Table.Root class="border">
            <Table.Header class="bg-muted/30">
                <Table.Row>
                    <Table.Head class="w-2/3">Titre</Table.Head>
                    <Table.Head class="w-1/6 text-center">Ajouté le</Table.Head>
                    <Table.Head class="w-1/6 text-center">Modifié le</Table.Head>
                    <Table.Head class="w-12 text-right">Actions</Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body class="divide-y divide-border">
{#each filteredGames as game (game.folderSlug)}
                    <Table.Row 
                        class="cursor-pointer hover:bg-muted/50 transition-colors h-16 group" 
                        onclick={() => gameSelected(game)}
                    >
                        <Table.Cell class="relative font-bold overflow-hidden">
                            {#if game.folderSlug}
                                <div class="absolute inset-0 left-0 w-96 bg-cover bg-center rounded-l"
                                    style="background-image:url('{PUBLIC_MEDIAS_URL}/games/{game.folderSlug}/screenshot_small_1.webp'); -webkit-mask-image: linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%); mask-image: linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%);"></div>
                                <div class="absolute inset-0 left-0 right-0 bg-linear-to-r from-transparent via-transparent to-background pointer-events-none"></div>
                                <div class="absolute inset-0 left-0 w-96 bg-linear-to-r from-black/90 via-black/50 to-transparent pointer-events-none"></div>
                                <div class="absolute inset-0 bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            {/if}
                            <span class="relative z-10 text-left text-sm sm:text-base font-bold drop-shadow-lg px-4 h-full flex items-center">
                                {game.title}
                            </span>
                        </Table.Cell>
                        <Table.Cell class="text-sm text-muted-foreground text-center">
                            {#if game.dateAdded}
                                {(() => {
                                    const date = new Date(game.dateAdded);
                                    const formatted = date.toLocaleDateString('fr-FR');
                                    // Don't show if it's 01/01/01 or year 1
                                    return formatted !== '01/01/0001' && date.getFullYear() > 1900 ? formatted : '-';
                                })()}
                            {:else}
                                -
                            {/if}
                        </Table.Cell>
                        <Table.Cell class="text-sm text-muted-foreground text-center">
                            {#if game.dateUpdated}
                                {(() => {
                                    const date = new Date(game.dateUpdated);
                                    const formatted = date.toLocaleDateString('fr-FR');
                                    // Don't show if it's 01/01/01 or year 1
                                    return formatted !== '01/01/0001' && date.getFullYear() > 1900 ? formatted : '-';
                                })()}
                            {:else}
                                -
                            {/if}
                        </Table.Cell>
                        <Table.Cell class="text-right w-20">
                            {#if game.folderSlug}
                                <Popover.Root
                                    open={popoverStates[game.folderSlug] === true}
                                    onOpenChange={(isOpen) => {
                                        if (game.folderSlug) {
                                            popoverStates[game.folderSlug] = isOpen;
                                        }
                                    }}
                                >
                                    <Popover.Trigger class={buttonVariants({ variant: "ghost", size: "sm" })} onclick={(e) => e.stopPropagation()}>
                                        <Trash2 class="size-4 text-danger" />
                                    </Popover.Trigger>
                                    <Popover.Content class="w-56">
                                        <div class="flex flex-col gap-3">
                                            <div>
                                                <span class="font-semibold block">Êtes-vous sûr ?</span>
                                                <span class="text-sm text-muted-foreground">Cette action est irréversible.</span>
                                            </div>
                                            <div class="flex gap-2 justify-end">
                                                <Popover.Close>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onclick={() => closePopover(game.folderSlug)}
                                                    >
                                                        Annuler
                                                    </Button>
                                                </Popover.Close>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onclick={() => handleDelete(game)}
                                                >
                                                    Supprimer
                                                </Button>
                                            </div>
                                        </div>
                                    </Popover.Content>
                                </Popover.Root>
                            {/if}
                        </Table.Cell>
                    </Table.Row>
                {/each}
            </Table.Body>
        </Table.Root>
        </div>
    </div>
{/if}

<style>
    :global(table) {
        width: 100%;
        table-layout: fixed;
    }
    
    :global(table thead th:first-child) {
        width: 40.666%;
    }
    
    :global(table thead th:nth-child(2)) {
        width: 16.667%;
    }
    
    :global(table thead th:nth-child(3)) {
        width: 16.667%;
    }
    
    :global(table thead th:last-child) {
        width: 8.334%;
    }
</style>

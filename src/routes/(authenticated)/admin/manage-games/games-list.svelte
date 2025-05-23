<script lang="ts">
    import * as Table from "$lib/components/ui/table/index.js";
    import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";

    import { Skeleton } from "$src/lib/components/ui/skeleton";
    import { GamesStore } from "$src/lib/stores/games.svelte";
    import { buttonVariants } from "$src/lib/components/ui/button/button.svelte";
    import ScrollArea from "$src/lib/components/ui/scroll-area/scroll-area.svelte";
    import type { InstallableGame } from "$src/lib/shared-models";

    let { gameSelected }: { gameSelected: (game: InstallableGame) => void } = $props();

    // State to track which dialog is open (if any)
    let openDialogId = $state<string | null>(null);

    // Function to handle game deletion
    function handleDeleteGame(folderSlug: string) {
        GamesStore.deleteGame(folderSlug);
        // Close the dialog after deletion
        openDialogId = null;
    }
</script>

<ScrollArea class="h-full max-h-[calc(100vh-100px)] w-full">
    {#if GamesStore.gamesLoading}
        <Skeleton />
    {:else}
        <Table.Root>
            <Table.Caption>Jeux disponibles</Table.Caption>
            <Table.Header>
                <Table.Row>
                    <Table.Head>Nom</Table.Head>
                    <Table.Head class="text-right"></Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#each GamesStore.games as game}
                    <Table.Row>
                        <Table.Cell class="relative w-full" onclick={() => gameSelected(game)}>
                            <div
                                class="absolute inset-0 w-2/3 bg-cover bg-center mask-linear mask-dir-to-r mask-point-to-[80%]"
                                style="background-image: url('/api/resources/{game.cover}')">
                            </div>
                            <div class="absolute inset-y-0 right-0 w-1/2"></div>
                            <span
                                class="hover:text-primary-600 absolute right-4 top-1/2 z-10
                                    -translate-y-1/2 text-right text-sm font-bold
                                    shadow-lg transition-colors duration-200 hover:underline sm:text-base">
                                {game.title}
                            </span>
                        </Table.Cell>
                        <Table.Cell class="text-right">
                            <AlertDialog.Root open={openDialogId === game.folderSlug}>
                                <AlertDialog.Trigger
                                    class={buttonVariants({ variant: "outline" })}
                                    onclick={() => (openDialogId = game.folderSlug || null)}>
                                    Supprimer
                                </AlertDialog.Trigger>
                                <AlertDialog.Content>
                                    <AlertDialog.Header>
                                        <AlertDialog.Title>Êtes-vous sûr ?</AlertDialog.Title>
                                        <AlertDialog.Description>
                                            Cette action est irréversible.
                                            <br />
                                            Seul le fichier
                                            <code>game.ini</code>
                                            sera supprimé du dossier.
                                        </AlertDialog.Description>
                                    </AlertDialog.Header>
                                    <AlertDialog.Footer>
                                        <AlertDialog.Cancel onclick={() => (openDialogId = null)}>
                                            Annuler
                                        </AlertDialog.Cancel>
                                        <AlertDialog.Action onclick={() => handleDeleteGame(game.folderSlug || "")}>
                                            Supprimer
                                        </AlertDialog.Action>
                                    </AlertDialog.Footer>
                                </AlertDialog.Content>
                            </AlertDialog.Root>
                        </Table.Cell>
                    </Table.Row>
                {/each}
            </Table.Body>
        </Table.Root>
    {/if}
</ScrollArea>

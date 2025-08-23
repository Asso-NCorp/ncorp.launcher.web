<script lang="ts">
    import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
    import { buttonVariants } from "$src/lib/components/ui/button/button.svelte";
    import type { InstallableGame } from "$src/lib/shared-models";
    import { GamesStore } from "$src/lib/states/games.svelte";

    let { game }: { game: InstallableGame } = $props();
    let open = $state(false);

    function deleteGame() {
        if (game.folderSlug) {
            GamesStore.deleteGame(game.folderSlug);
        }
        open = false;
    }
</script>

<AlertDialog.Root bind:open>
    <AlertDialog.Trigger class={buttonVariants({ variant: "outline" })} onclick={() => (open = true)}>
        Supprimer
    </AlertDialog.Trigger>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Supprimer “{game.title}” ?</AlertDialog.Title>
            <AlertDialog.Description>
                Vous êtes sur le point de supprimer <strong>{game.title}</strong>
                .
                <br />
                Cette action est irréversible.
                <br />
                Seul le fichier
                <code>game.ini</code>
                sera supprimé du dossier.
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel onclick={() => (open = false)}>Annuler</AlertDialog.Cancel>
            <AlertDialog.Action onclick={deleteGame}>Supprimer</AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>

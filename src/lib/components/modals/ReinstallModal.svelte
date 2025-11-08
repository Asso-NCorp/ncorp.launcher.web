<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import { Button } from "$lib/components/ui/icon-button";
    import { reinstallModalStore } from "$src/lib/states/reinstall-modal.svelte";
    import { GamesStore } from "$src/lib/states/games.svelte";

    let isLoading = $state(false);
    let isOpen = $state(false);

    // Keep isOpen in sync with store
    $effect(() => {
        isOpen = reinstallModalStore.isOpen;
    });

    const handleConfirm = async () => {
        if (!reinstallModalStore.game) return;

        try {
            isLoading = true;
            await GamesStore.deleteGame(reinstallModalStore.game.folderSlug!);
            await GamesStore.installGame(reinstallModalStore.game, true);
            reinstallModalStore.close();
        } finally {
            isLoading = false;
        }
    };

    const handleOpenChange = (value: boolean) => {
        if (value) {
            isOpen = true;
        } else {
            reinstallModalStore.close();
            isOpen = false;
        }
    };
</script>

<Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>Confirmer la réinstallation</Dialog.Title>
        </Dialog.Header>
        <div class="py-4">
            <p class="text-muted-foreground text-sm">Voulez-vous lancer la réinstallation ?</p>
            {#if reinstallModalStore.game}
                <p class="mt-2 font-semibold">{reinstallModalStore.game.title}</p>
            {/if}
        </div>
        <Dialog.Footer class="flex justify-end gap-2">
            <Dialog.Close>
                <Button variant="outline">Annuler</Button>
            </Dialog.Close>
            <Button {isLoading} disabled={isLoading} variant="destructive" onclick={handleConfirm}>Réinstaller</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

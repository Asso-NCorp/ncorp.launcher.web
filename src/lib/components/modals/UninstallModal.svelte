<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import { Button } from "$lib/components/ui/icon-button";
    import { uninstallModalStore } from "$src/lib/states/uninstall-modal.svelte";
    import { GamesStore } from "$src/lib/states/games.svelte";

    let isLoading = $state(false);
    let isOpen = $state(false);

    // Keep isOpen in sync with store
    $effect(() => {
        isOpen = uninstallModalStore.isOpen;
    });

    const handleConfirm = async () => {
        if (!uninstallModalStore.game) return;

        try {
            isLoading = true;
            await GamesStore.uninstallGame(uninstallModalStore.game);
            uninstallModalStore.close();
        } finally {
            isLoading = false;
        }
    };

    const handleOpenChange = (value: boolean) => {
        if (value) {
            isOpen = true;
        } else {
            uninstallModalStore.close();
            isOpen = false;
        }
    };
</script>

<Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>Confirmer la désinstallation</Dialog.Title>
        </Dialog.Header>
        <div class="py-4">
            <p class="text-muted-foreground text-sm">Êtes-vous sûr de vouloir désinstaller ce jeu ?</p>
            {#if uninstallModalStore.game}
                <p class="mt-2 font-semibold">{uninstallModalStore.game.title}</p>
            {/if}
        </div>
        <Dialog.Footer class="flex justify-end gap-2">
            <Dialog.Close>
                <Button variant="outline">Annuler</Button>
            </Dialog.Close>
            <Button {isLoading} disabled={isLoading} variant="destructive" onclick={handleConfirm}>Désinstaller</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

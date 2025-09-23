<script lang="ts">
    import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
    import { goto } from "$app/navigation";
    import { Gamepad2, MoveRight, Folder } from "@lucide/svelte";

    export let open = false;
</script>

<AlertDialog.Root {open}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Configurer le répertoire des jeux</AlertDialog.Title>
            <AlertDialog.Description>
                <div class="flex w-full items-center justify-between gap-2">
                    <Gamepad2 class="text-primary size-20 p-4" />
                    <MoveRight class="size-20 p-4 text-yellow-600" />
                    <Folder class="text-primary size-20 p-4" />
                </div>
                Avant de continuer vous devez configurer le répertoire où seront installés les jeux.
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Action
                onclick={() => {
                    goto("/my/settings");
                }}>
                Continuer
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>

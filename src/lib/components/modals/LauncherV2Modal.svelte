<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import { Button } from "$lib/components/ui/icon-button";
    import { onMount } from "svelte";
    import { ExternalLink, Sparkles } from "@lucide/svelte";

    const STORAGE_KEY = "launcher-v2-announcement-seen";
    const NEW_LAUNCHER_URL = "https://auth-v2.n-corp.fr";

    let isOpen = $state(false);

    onMount(() => {
        try {
            if (!localStorage.getItem(STORAGE_KEY)) {
                isOpen = true;
            }
        } catch {
            // ignore (e.g. private mode)
        }
    });

    const markSeen = () => {
        try {
            localStorage.setItem(STORAGE_KEY, "1");
        } catch {
            // ignore
        }
    };

    const handleOpenChange = (value: boolean) => {
        isOpen = value;
        if (!value) markSeen();
    };

    const handleOpenNewLauncher = () => {
        markSeen();
        window.open(NEW_LAUNCHER_URL, "_blank", "noopener,noreferrer");
        isOpen = false;
    };
</script>

<Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title class="flex items-center gap-2">
                <Sparkles class="size-5 text-primary" />
                N-Corp Launcher v2 est disponible !
            </Dialog.Title>
        </Dialog.Header>
        <div class="space-y-3 py-2 text-sm text-muted-foreground">
            <p>
                Nous avons développé un <strong class="text-foreground">tout nouveau launcher</strong>. La version
                actuelle que vous utilisez est désormais
                <strong class="text-foreground">obsolète</strong> et ne sera plus maintenue.
            </p>
            <p>
                Nous vous invitons à passer dès maintenant au nouveau
                <strong class="text-foreground">N-Corp Launcher v2</strong> pour profiter des dernières fonctionnalités
                et améliorations.
            </p>
            <p>
                Bonne nouvelle : <strong class="text-foreground">l'application Agent n'est plus nécessaire</strong>.
                Le nouveau launcher est désormais une <strong class="text-foreground">application unique</strong>,
                vous pouvez donc désinstaller l'agent de votre machine.
            </p>
            <p class="text-xs">
                Lien :
                <a
                    href={NEW_LAUNCHER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-primary underline underline-offset-2 break-all"
                >
                    {NEW_LAUNCHER_URL}
                </a>
            </p>
        </div>
        <Dialog.Footer class="flex justify-end gap-2">
            <Dialog.Close>
                <Button variant="outline">Plus tard</Button>
            </Dialog.Close>
            <Button onclick={handleOpenNewLauncher}>
                Ouvrir le Launcher v2
                <ExternalLink class="ml-1 size-4" />
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

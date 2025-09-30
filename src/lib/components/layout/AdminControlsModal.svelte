<script lang="ts">
    import * as Dialog from "$src/lib/components/ui/dialog/index.js";
    import Input from "../ui/input/input.svelte";
    import Button from "../ui/button/button.svelte";
    import { Send } from "@lucide/svelte";
    import { Textarea } from "../ui/textarea";
    import { liveServerConnection } from "$src/lib/states/live-server.svelte";
    import { toast } from "svelte-sonner";

    let { open = $bindable() }: { open: boolean } = $props();

    let title = $state("");
    let message = $state("");
    let disabled = $derived(title.trim().length === 0 || message.trim().length === 0);

    const sendNotification = async () => {
        if(liveServerConnection.connectionState !== "Connected") {
            toast.error("Connexion au serveur perdue. Impossible d'envoyer la notification.");
            return;
        }
        await liveServerConnection.connection.send("SendDesktopNotification", title.trim(), message.trim());
        // Reset fields after sending
        title = "";
        message = "";
    };
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-[500px]">
        <Dialog.Header>
            <Dialog.Title>Admin</Dialog.Title>
            <Dialog.Description>
                Envoyer une notification à tous les utilisateurs connectés
            </Dialog.Description>
        </Dialog.Header>
        
        <div class="flex flex-col gap-4 py-4">
            <div class="flex flex-col gap-2">
                <label for="notification-title" class="text-sm font-medium">Titre</label>
                <Input
                    id="notification-title"
                    placeholder="Titre de la notification"
                    bind:value={title}
                />
            </div>
            
            <div class="flex flex-col gap-2">
                <label for="notification-message" class="text-sm font-medium">Message</label>
                <Textarea
                    id="notification-message"
                    placeholder="Votre message..."
                    class="min-h-[100px]"
                    bind:value={message}
                />
            </div>
        </div>
        
        <Dialog.Footer>
            <Button variant="outline" onclick={() => open = false}>
                Annuler
            </Button>
            <Button {disabled} onclick={sendNotification}>
                <Send class="mr-2 h-4 w-4" />
                Envoyer
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
<script lang="ts">
    import { ChatStore } from "$lib/states/chat.svelte";
    import Input from "$lib/components/ui/input/input.svelte";
    import Button from "$lib/components/ui/button/button.svelte";
    let value = $state("");
    let { onClose }: { onClose?: () => void } = $props();
    const placeholder = () =>
        ChatStore.activeChannel
            ? `Message #${ChatStore.activeChannel.name}`
            : ChatStore.activeDMId
              ? "Message privé"
              : "Choisissez un salon dans /chat";
    function send() {
        if (!value.trim()) return;
        ChatStore.sendMessage(value);
        value = "";
        onClose?.();
    }
    function keydown(e: KeyboardEvent) {
        if (e.key === "Escape") onClose?.();
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    }
</script>

<div class="pointer-events-auto w-[380px] rounded-md border border-border bg-card p-3 shadow-lg">
    <Input
        bind:value
        placeholder={placeholder()}
        onkeydown={keydown}
        aria-label="Message rapide"
        class="h-10 text-sm" />
    <div class="mt-2 flex items-center justify-between">
        <Button variant="ghost" size="sm" class="h-7 px-2 text-[11px]" onclick={() => onClose?.()}>Echap fermer</Button>
        <Button
            size="sm"
            class="h-8 px-3 text-xs disabled:opacity-50"
            disabled={!value.trim() || (!ChatStore.activeChannelId && !ChatStore.activeDMId)}
            onclick={send}>
            Envoyer
        </Button>
    </div>
</div>

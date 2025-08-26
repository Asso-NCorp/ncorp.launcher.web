<script lang="ts">
    import { ChatStore } from "$lib/states/chat.svelte";
    import ChatComposer from "./ChatComposer.svelte";

    function placeholder() {
        if (ChatStore.activeChannel) return `Message #${ChatStore.activeChannel.name}`;
        if (ChatStore.activeDMId) return "Message privé";
        return "Sélectionnez un salon...";
    }

    function handleSend(e: CustomEvent<{ content: string }>) {
        ChatStore.sendMessage(e.detail.content);
    }

    function handleAttach(e: CustomEvent<{ files: File[] }>) {
        // TODO: upload; temporary feedback
        const names = e.detail.files.map((f) => f.name).join(", ");
        ChatStore.sendMessage(`[Images] ${names}`);
    }
</script>

<div class="border-t border-border pt-2">
    <ChatComposer placeholder={placeholder()} on:send={handleSend} on:attach={handleAttach} />
</div>

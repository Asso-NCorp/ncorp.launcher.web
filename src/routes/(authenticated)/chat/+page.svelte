<script lang="ts">
    import { ChatStore } from "$lib/states/chat.svelte";
    import ChatMessages from "$lib/components/chat/ChatMessages.svelte";
    import ChatMessageInput from "$lib/components/chat/ChatMessageInput.svelte";
</script>

<div class="flex flex-1 flex-col">
    {#if !ChatStore.activeChannel && !ChatStore.activeDMId}
        <div class="m-auto text-center text-sm text-muted-foreground">Sélectionnez un salon ou un message privé.</div>
    {:else}
        <ChatMessages />
        <ChatMessageInput />
    {/if}
</div>

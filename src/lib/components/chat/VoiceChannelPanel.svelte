<script lang="ts">
    import { ChatStore } from "$lib/states/chat.svelte";
    const channel = () =>
        ChatStore.activeChannel && ChatStore.activeChannel.type === "voice" ? ChatStore.activeChannel : null;
</script>

{#if channel()}
    <div class="rounded-md border border-border bg-muted/10 p-2 text-xs">
        <p class="mb-1 font-medium">Salon vocal: {channel()!.name}</p>
        <p class="text-muted-foreground">Module vocal à intégrer (WebRTC) ultérieurement.</p>
        <div class="mt-2 flex gap-2">
            <button class="rounded bg-primary px-2 py-1 text-[11px] text-primary-foreground">Rejoindre</button>
            <button class="rounded bg-destructive px-2 py-1 text-[11px] text-destructive-foreground">Quitter</button>
        </div>
    </div>
{/if}

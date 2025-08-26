<script lang="ts">
    import ChatServersList from "$lib/components/chat/ChatServersList.svelte";
    import ChatChannelsList from "$lib/components/chat/ChatChannelsList.svelte";
    import { ChatStore } from "$lib/states/chat.svelte";
    import VoiceChannelPanel from "$lib/components/chat/VoiceChannelPanel.svelte";
    import { onMount } from "svelte";
    import type { LayoutProps } from "./$types";
    let { children }: LayoutProps = $props();
    onMount(() => {
        ChatStore.init();
        ChatStore.connectRealtime();
    });
</script>

<!-- NEW THREE-COLUMN LAYOUT -->
<div class="flex h-full">
    <!-- Servers rail -->
    <aside class="servers-rail flex w-[72px] flex-col border-r border-border bg-card">
        <ChatServersList />
    </aside>

    <!-- Channels + DMs -->
    <aside class="channels-col flex w-60 flex-col border-r border-border bg-card/80 p-2 backdrop-blur">
        <!-- REMOVED DM heading & list -->
        <h2 class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {ChatStore.activeServerId === "_dms"
                ? "Messages privés"
                : `Salons ${ChatStore.activeServer ? "(" + ChatStore.activeServer.name + ")" : ""}`}
        </h2>
        <ChatChannelsList />
        <!-- <div class="mt-4">
            <VoiceChannelPanel />
        </div> -->
    </aside>

    <!-- Main chat area -->
    <main class="flex flex-1 flex-col overflow-hidden p-2">
        <!-- REMOVED duplicated ChatMessages / ChatMessageInput block -->
        {@render children?.()}
    </main>
</div>

<style>
    /* Optional: hide scrollbar on servers rail if it overflows vertically */
    .servers-rail::-webkit-scrollbar {
        width: 0;
    }
</style>

<script lang="ts">
    import type { ServerItemData } from "$src/lib/types";
    import ServerItem from "./ServerItem.svelte";
    import { chatController } from "$lib/controllers/ChatController.svelte";

    const { servers = [], selectServer } = $props<{
        servers?: ServerItemData[];
        selectServer: (id: string) => void;
    }>();

    // Derive selected state from the controller (single source of truth)
    const selectedId = $derived(chatController.contextState.selectedServerId);

    function applySelect(id: string) {
        selectServer(id);
    }
</script>

<aside class="flex h-full flex-col items-center gap-3 border-r bg-background py-3 pr-1 overflow-visible pl-4">
    {#each servers as server (server.id)}
        <ServerItem {server} selected={server.id === selectedId} select={() => applySelect(server.id)} />
    {/each}

    <div class="mt-auto" />
</aside>

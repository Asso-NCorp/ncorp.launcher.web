<script lang="ts">
    import type { ServerItemData } from "$src/lib/types";
    import ServerItem from "./ServerItem.svelte";
    import { onMount } from "svelte";
    import { chatStore } from "$src/lib/chat/chat.svelte";

    const { servers = [], selectServer } = $props<{
        servers?: ServerItemData[];
        selectServer: (id: string) => void;
    }>();

    const LAST_SERVER_KEY = "chat:lastServerId";
    let selectedId = $state<string | null>(null);

    function applySelect(id: string) {
        selectedId = id;
        try {
            localStorage.setItem(LAST_SERVER_KEY, id);
        } catch {}
        selectServer(id);
        chatStore.selectServer(id);
    }

    onMount(() => {
        if (!servers.length) return;
        let stored: string | null = null;
        try {
            stored = localStorage.getItem(LAST_SERVER_KEY);
        } catch {}
        const target = (stored && servers.some((s) => s.id === stored) && stored) || servers[0].id;
        applySelect(target);
    });

    $effect(() => {
        // if selected removed -> pick first
        if (selectedId && !servers.some((s) => s.id === selectedId)) {
            if (servers.length) applySelect(servers[0].id);
            else selectedId = null;
        }
        // if none selected but servers available (late load)
        if (!selectedId && servers.length) {
            let stored: string | null = null;
            try {
                stored = localStorage.getItem(LAST_SERVER_KEY);
            } catch {}
            const target = (stored && servers.some((s) => s.id === stored) && stored) || servers[0].id;
            applySelect(target);
        }
    });
</script>

<aside class="flex h-full flex-col items-center gap-3 border-r bg-background py-3 pr-1">
    {#each servers as server (server.id)}
        <ServerItem {server} selected={server.id === selectedId} select={() => applySelect(server.id)} />
    {/each}

    <div class="mt-auto" />
</aside>

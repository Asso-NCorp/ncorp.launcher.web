<script lang="ts">
    import { ChatStore } from "$lib/states/chat.svelte";
    import { DM_SERVER_ID } from "$lib/states/chat.svelte";
    import { onMount } from "svelte";
    import * as Tooltip from "$lib/components/ui/tooltip/index.js";
    import ChatServerButton from "./ChatServerButton.svelte";
    import { SquareUserRound } from "@lucide/svelte";

    const servers = () => ChatStore.servers;
    const active = () => ChatStore.activeServerId;

    onMount(() => {
        if (!servers().length) ChatStore.init();
    });

    function initials(name: string) {
        return name
            .split(/\s+/)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase())
            .join("");
    }

    // Example: compute notification counts per server (placeholder logic)
    const serverNotifications = (id: string) => {
        // Customize with real unread logic later
        if (id === DM_SERVER_ID && ChatStore.dms.length > 0) return true; // dot
        return 0;
    };
</script>

<!-- Vertical servers column (rail) -->
<div class="flex flex-1 flex-col items-center gap-3 overflow-y-auto py-3">
    {#if servers().length === 0}
        <span class="px-2 py-1 text-center text-[11px] leading-tight text-muted-foreground">Aucun serveur</span>
    {:else}
        {#each servers() as s}
            <Tooltip.Root>
                <Tooltip.Trigger>
                    <ChatServerButton
                        active={active() === s.id}
                        label={s.id === DM_SERVER_ID ? "Messages privés" : s.name}
                        icon={s.id === DM_SERVER_ID ? SquareUserRound : undefined}
                        imageUrl={s.icon_url || ""}
                        text={!s.icon_url && s.id !== DM_SERVER_ID ? initials(s.name) : ""}
                        notifications={serverNotifications(s.id)}
                        onclick={() => ChatStore.selectServer(s.id)} />
                </Tooltip.Trigger>
                <Tooltip.Content side="right" class="px-2 py-1 text-xs">
                    {s.id === DM_SERVER_ID ? "Messages privés" : s.name}
                </Tooltip.Content>
            </Tooltip.Root>
        {/each}
    {/if}
</div>

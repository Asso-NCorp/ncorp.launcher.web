<script lang="ts">
    import StatusDot from "$src/lib/components/custom/StatusDot.svelte";
    import type { HubConnectionState } from "@microsoft/signalr";

    export let agentState: HubConnectionState | undefined;
    export let agentVersion: string | undefined;
    export let serverState: HubConnectionState | undefined;
</script>

<div
    class="text-muted-foreground flex h-full flex-col items-center justify-center border-l px-2 pl-2 text-xs whitespace-nowrap">
    <div class="flex items-center gap-1.5" aria-label="Agent status">
        <span>Agent</span>
        <StatusDot variant="inline" status={agentState} />
        {#if agentVersion}
            <span>{agentVersion}</span>
        {/if}
    </div>
    <div class="flex items-center gap-1.5" aria-label="Serveur status">
        <span>Serveur</span>
        <StatusDot variant="inline" status={serverState} />
    </div>
</div>

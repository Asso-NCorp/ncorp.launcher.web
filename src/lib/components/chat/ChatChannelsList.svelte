<script lang="ts">
    import { ChatStore } from "$lib/states/chat.svelte";
    import { DM_SERVER_ID } from "$lib/states/chat.svelte";
    import type { ChatChannel } from "$lib/states/chat.types";
    import Input from "$lib/components/ui/input/input.svelte";
    import { Search } from "@lucide/svelte";
    import Button from "$lib/components/ui/button/button.svelte";

    const serverId = () => ChatStore.activeServerId;
    const isDMContext = () => serverId() === DM_SERVER_ID;
    const channels = () => (isDMContext() ? [] : serverId() ? ChatStore.channelsByServer[serverId()!] || [] : []);
    const dms = () => ChatStore.dms;
    const activeChannelId = () => ChatStore.activeChannelId;
    const activeDMId = () => ChatStore.activeDMId;

    let query = $state("");

    const filteredChannels = () => channels().filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
    const filteredDMs = () =>
        dms().filter((dm) => (dm.title || dm.participant_ids.join(", ")).toLowerCase().includes(query.toLowerCase()));

    function select(c: ChatChannel) {
        if (c.type === "text") ChatStore.selectChannel(c.id);
    }
    function selectDM(id: string) {
        ChatStore.selectDM(id);
    }
</script>

<div class="mb-2">
    <Input icon={Search} placeholder="Filtrer..." bind:value={query} class="h-8 text-xs" />
</div>

{#if isDMContext()}
    <div class="flex flex-col gap-1">
        {#each filteredDMs() as dm}
            <Button
                variant="ghost"
                size="sm"
                class="h-auto justify-start truncate px-2 py-1 text-sm {activeDMId() === dm.id
                    ? 'bg-primary/20 font-medium'
                    : ''}"
                onclick={() => selectDM(dm.id)}
                aria-current={activeDMId() === dm.id ? "true" : "false"}>
                {dm.title || dm.participant_ids.join(", ")}
            </Button>
        {/each}
        {#if filteredDMs().length === 0}
            <span class="px-2 py-1 text-[11px] text-muted-foreground">Aucun MP</span>
        {/if}
    </div>
{:else}
    <div class="flex flex-col gap-1">
        {#each filteredChannels() as c}
            <Button
                variant="ghost"
                size="sm"
                class="h-auto justify-start gap-2 px-2 py-1 text-sm {activeChannelId() === c.id
                    ? 'bg-primary/20 font-medium'
                    : ''}"
                onclick={() => select(c)}
                aria-current={activeChannelId() === c.id ? "true" : "false"}>
                <span class="text-xs uppercase opacity-60">{c.type === "voice" ? "🔊" : "#"}</span>
                {c.name}
            </Button>
        {/each}
        {#if filteredChannels().length === 0}
            <span class="px-2 py-1 text-[11px] text-muted-foreground">Aucun salon</span>
        {/if}
    </div>
{/if}

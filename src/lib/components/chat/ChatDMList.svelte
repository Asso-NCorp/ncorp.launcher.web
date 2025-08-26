<script lang="ts">
    import { ChatStore } from "$lib/states/chat.svelte";
    const dms = () => ChatStore.dms;
    const active = () => ChatStore.activeDMId;
    function select(id: string) {
        ChatStore.selectDM(id);
    }
    import Button from "$lib/components/ui/button/button.svelte";
</script>

<div class="mt-4">
    <h3 class="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Messages privés</h3>
    {#each dms() as dm}
        <Button
            variant="ghost"
            size="sm"
            class="h-auto justify-start truncate px-2 py-1 text-sm {active() === dm.id
                ? 'bg-primary/20 font-medium'
                : ''}"
            onclick={() => select(dm.id)}
            aria-current={active() === dm.id ? "true" : "false"}>
            {dm.title || dm.participant_ids.join(", ")}
        </Button>
    {/each}
    {#if dms().length === 0}
        <p class="px-2 py-1 text-[11px] text-muted-foreground">Aucun MP</p>
    {/if}
</div>

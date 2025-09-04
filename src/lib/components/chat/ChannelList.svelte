<script lang="ts">
    import { Lock, Hash } from "@lucide/svelte";
    import { cn } from "$lib/utils";
    import type { ChannelItemData } from "$src/lib/types";

    const {
        channels = [],
        currentId = null,
        onSelect,
        title = "Channels",
    } = $props<{
        channels?: ChannelItemData[];
        currentId?: string | null;
        onSelect: (id: string) => void;
        title?: string;
    }>();
</script>

<aside class="flex h-full w-64 flex-col border-r bg-muted/40">
    <div class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
    <div class="flex-1 overflow-auto">
        {#each channels as c (c.id)}
            {@const selected = c.id === currentId}
            <button
                class={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted/70",
                    selected && "bg-muted font-semibold",
                )}
                onclick={() => onSelect(c.id)}
                aria-current={selected ? "true" : "false"}>
                {#if c.isPrivate}<Lock class="h-4 w-4" />{:else}<Hash class="h-4 w-4" />{/if}
                <span class="truncate">{c.name}</span>
                {#if c.unread}<span class="ml-auto h-2 w-2 rounded-full bg-primary" />{/if}
            </button>
        {/each}
    </div>
</aside>

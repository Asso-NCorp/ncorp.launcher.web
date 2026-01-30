<script lang="ts">
    import { Lock, Hash, User } from "@lucide/svelte";
    import { cn } from "$lib/utils";
    import type { ChannelItemData } from "$src/lib/types";
    import * as Accordion from "$lib/components/ui/accordion/index.js";

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

    function isTextChannel(c: ChannelItemData): boolean {
        return c.type !== "direct";
    }

    function isDirectMessage(c: ChannelItemData): boolean {
        return c.type === "direct";
    }

    const textChannels: ChannelItemData[] = $derived(channels.filter(isTextChannel));
    const directMessages: ChannelItemData[] = $derived(channels.filter(isDirectMessage));

    // Track failed image loads - use object instead of Map for better Svelte reactivity
    let failedImages: Record<string, boolean> = $state({});

    function handleImageError(channelId: string) {
        failedImages[channelId] = true;
        failedImages = { ...failedImages };
    }

    function isImageFailed(channelId: string): boolean {
        return !!failedImages[channelId];
    }
</script>

<aside class="flex h-full w-64 flex-col border-r bg-muted/40">
    <!-- Replaced static title + list with accordion -->
    <Accordion.Root type="multiple" class="w-full" value={['text-channels', 'direct-messages']}>
        {#if textChannels.length > 0}
            <Accordion.Item value="text-channels">
                <Accordion.Trigger class="px-3 py-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Salons textuels
                </Accordion.Trigger>
                <Accordion.Content>
                    <div class="flex-1 overflow-auto">
                        {#each textChannels as c (c.id)}
                            {@const selected = c.id === currentId}
                            <button
                                class={cn(
                                    "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted/70",
                                    selected && "bg-muted font-semibold",
                                )}
                                onclick={() => onSelect(c.id)}
                                aria-current={selected ? "true" : "false"}>
                                {#if c.type === "group"}<Lock class="h-4 w-4" />{:else}<Hash class="h-4 w-4" />{/if}
                                <span class="truncate">{c.name}</span>
                                {#if c.unreadCount}<span class="ml-auto h-2 w-2 rounded-full bg-primary" />{/if}
                            </button>
                        {/each}
                    </div>
                </Accordion.Content>
            </Accordion.Item>
        {/if}

        {#if directMessages.length > 0}
            <Accordion.Item value="direct-messages">
                <Accordion.Trigger class="px-3 py-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Messages directs
                </Accordion.Trigger>
                <Accordion.Content>
                    <div class="flex-1 overflow-auto">
                        {#each directMessages as c (c.id)}
                            {@const selected = c.id === currentId}
                            <button
                                class={cn(
                                    "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted/70",
                                    selected && "bg-muted font-semibold",
                                )}
                                onclick={() => onSelect(c.id)}
                                aria-current={selected ? "true" : "false"}>
                                <div class="relative h-4 w-4">
                                    <!-- Default user icon -->
                                    <User class="h-4 w-4" />
                                    <!-- Avatar image overlay if available and not failed -->
                                    {#if c.avatarUrl && !isImageFailed(c.id)}
                                        <img
                                            src={c.avatarUrl}
                                            alt={c.name}
                                            class="absolute inset-0 h-4 w-4 rounded-full object-cover"
                                            onload={() => console.log("[ChannelList] Image loaded for channel:", c.id)}
                                            onerror={() => {
                                                console.log("[ChannelList] Image FAILED for channel:", c.id, "url:", c.avatarUrl);
                                                handleImageError(c.id);
                                            }} />
                                    {/if}
                                </div>
                                <span class="truncate">{c.name}</span>
                                {#if c.unreadCount}<span class="ml-auto h-2 w-2 rounded-full bg-primary" />{/if}
                            </button>
                        {/each}
                    </div>
                </Accordion.Content>
            </Accordion.Item>
        {/if}
    </Accordion.Root>
</aside>

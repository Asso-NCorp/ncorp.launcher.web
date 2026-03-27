<script lang="ts">
    import * as DropdownMenu from "$src/lib/components/ui/dropdown-menu/index.js";
    import { buttonVariants } from "$src/lib/components/ui/button";
    import { Calendar } from "@lucide/svelte";
    import { TooltipProvider } from "$src/lib/components/ui/tooltip";
    import * as Tooltip from "$src/lib/components/ui/tooltip/index.js";
    import dayjs from "dayjs";
    import utc from "dayjs/plugin/utc";
    import { Progress } from "$src/lib/components/ui/progress";
    import Separator from "$src/lib/components/ui/separator/separator.svelte";
    import { goto } from "$app/navigation";
    import { onMount, onDestroy } from "svelte";

    dayjs.extend(utc);
    const dayjsUtc = (d?: dayjs.ConfigType) => dayjs.utc(d);

    type EventItem = {
        name: string;
        start_time: Date;
        end_time: Date | null;
        description?: string;
        image_url?: string;
        url?: string;
    };

    let { events = [] }: { events: EventItem[] } = $props();

    // Reactive tick counter that increments every minute to force progress recalc
    let tick = $state(0);
    let interval: ReturnType<typeof setInterval> | undefined;

    onMount(() => {
        interval = setInterval(() => { tick++; }, 60_000);
    });

    onDestroy(() => {
        if (interval) clearInterval(interval);
    });

    const formatRelative = (date: Date) => dayjsUtc(date).fromNow();
    const formatDateTime = (date: Date | null) => date ? dayjsUtc(date).format("DD/MM/YYYY HH:mm") : "";

    function getProgress(start: Date, end: Date | null): { value: number; max: number } | null {
        // Force reactivity on tick
        void tick;
        if (!end) return null;
        const now = dayjsUtc();
        const s = dayjsUtc(start);
        const e = dayjsUtc(end);
        const total = e.diff(s, "minute");
        if (total <= 0) return null;
        const elapsed = now.diff(s, "minute");
        return { value: Math.max(0, Math.min(elapsed, total)), max: total };
    }
</script>

<div class="flex h-full w-auto gap-1 border-l">
    <div class="flex flex-1 flex-col items-start justify-center">
        <DropdownMenu.Root>
            <DropdownMenu.Trigger class={buttonVariants({ variant: "ghost" })}>
                {#if events.length > 0}
                    {@const firstEvent = events[0]}
                    {@const progress = getProgress(firstEvent.start_time, firstEvent.end_time)}
                    <Tooltip.Root>
                        <Tooltip.Trigger class="flex items-center gap-2">
                            <Calendar class="text-muted-foreground" />
                            <div class="flex flex-col items-start">
                                <span class="text-sm font-medium">{firstEvent.name}</span>
                                <span class="text-muted-foreground text-xs">
                                    {formatRelative(firstEvent.start_time)}
                                </span>
                                {#if progress}
                                    <Progress
                                        value={progress.value}
                                        max={progress.max}
                                        class="text-primary-foreground h-1 w-full" />
                                {/if}
                            </div>
                            {#if firstEvent.image_url}
                                <img
                                    src={firstEvent.image_url}
                                    alt={firstEvent.name}
                                    class="h-10 w-auto object-cover" />
                            {/if}
                        </Tooltip.Trigger>
                        <Tooltip.Content>
                            <p>{dayjsUtc(firstEvent.start_time).format("DD/MM/YYYY HH:mm")}</p>
                        </Tooltip.Content>
                    </Tooltip.Root>
                {:else}
                    <span class="text-muted-foreground text-sm">Aucun événement</span>
                {/if}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content class="z-110 w-80">
                <DropdownMenu.Group>
                    <DropdownMenu.GroupHeading>Événements à venir</DropdownMenu.GroupHeading>
                    {#if events.length > 0}
                        {#each events as event, i}
                            <DropdownMenu.Item
                                class="cursor-pointer"
                                onclick={() => {
                                    if (event.url) {
                                        window.location.href = event.url;
                                    }
                                }}>
                                <div class="flex w-full flex-col gap-1">
                                    <div class="flex items-center justify-between">
                                        <span class="font-medium">{event.name}</span>
                                        <span class="text-muted-foreground text-xs">
                                            {formatRelative(event.start_time)}
                                        </span>
                                        {#if event.image_url}
                                            <img
                                                src={event.image_url}
                                                alt={event.name}
                                                class="h-10 w-auto object-cover" />
                                        {/if}
                                    </div>
                                    {#if event.description}
                                        <span class="text-muted-foreground line-clamp-2 text-xs">
                                            {event.description}
                                        </span>
                                    {/if}
                                    <span class="text-muted-foreground text-xs">
                                        {formatDateTime(event.start_time)}{event.end_time ? ` - ${formatDateTime(event.end_time)}` : ""}
                                    </span>
                                    <Separator class="my-1" />
                                </div>
                            </DropdownMenu.Item>
                        {/each}
                    {:else}
                        <DropdownMenu.Item disabled>
                            <span class="text-muted-foreground">Aucun événement programmé</span>
                        </DropdownMenu.Item>
                    {/if}
                </DropdownMenu.Group>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    </div>
</div>

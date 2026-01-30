<script lang="ts">
    import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "$lib/components/ui/tooltip";
    import * as Avatar from "$lib/components/ui/avatar";
    import { cn } from "$lib/utils";
    import type { ServerItemData } from "$src/lib/types";
    import { Mail } from "@lucide/svelte";

    const {
        server,
        select,
        selected = false,
    } = $props<{ server: ServerItemData; select: (id: string) => void; selected?: boolean }>();
    const unread = $derived(!!server.unread);
</script>

<TooltipProvider>
    <Tooltip>
        <TooltipTrigger>
            <button
                class={cn(
                    "group relative grid h-12 w-12 place-items-center rounded-3xl bg-muted transition-all hover:rounded-2xl focus:outline-none",
                    selected && "rounded-2xl", // keep shape change, no color change
                )}
                data-selected={selected}
                aria-current={selected ? "true" : "false"}
                onclick={() => select(server.id)}
                aria-label={server.name}>
                <!-- Notch indicator (ellipse when not selected, notch when selected) -->
                <span
                    aria-hidden="true"
                    class={cn(
                        "absolute top-1/2 -translate-y-1/2 bg-primary transition-all duration-200 rounded-full",
                        "-left-3",
                        selected
                            ? "h-8 w-1 opacity-100"
                            : "h-2.5 w-2.5 opacity-100 group-hover:scale-110",
                    )} />
                {#if server.iconName === "mail"}
                    <Mail class="h-6 w-6 text-muted-foreground" />
                {:else}
                    <Avatar.Root class="h-9 w-9">
                        {#if server.icon}
                            <Avatar.Image src={server.icon} alt={server.name} class="h-9 w-9 rounded-xl object-cover" />
                        {:else}
                            <Avatar.Fallback class="h-9 w-9 rounded-xl font-semibold">
                                {server.name?.slice(0, 2) ?? "SV"}
                            </Avatar.Fallback>
                        {/if}
                    </Avatar.Root>
                {/if}

                {#if unread}
                    <span class="absolute -right-1 top-1 h-2 w-2 rounded-full bg-emerald-500 shadow" />
                {/if}
            </button>
        </TooltipTrigger>
        <TooltipContent side="right" class="px-2 py-1">
            <p class="text-xs">{server.name}</p>
        </TooltipContent>
    </Tooltip>
</TooltipProvider>

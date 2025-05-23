<script lang="ts">
    import { global } from "$src/lib/states/global.svelte";
    import type { SideMenuSubItemProps } from "$src/lib/types";
    import { cn } from "$src/lib/utils";
    import * as Tooltip from "$lib/components/ui/tooltip";

    let {
        href,
        label,
        icon: Icon,
        iconClass,
        class: klazz,
        onClick,
        iconOnly = false,
    }: SideMenuSubItemProps = $props();
</script>

{#if global.sidebarCollapsed}
    <Tooltip.Root>
        <Tooltip.Trigger>
            {#if href}
                <a
                    {href}
                    class={cn(
                        "group flex min-w-0 items-center gap-2 rounded-[var(--radius)] p-1 hover:text-white/80",
                        iconOnly && "justify-center",
                        klazz,
                    )}>
                    <Icon
                        class={cn(
                            "size-8 flex-shrink-0 rounded-md p-1 group-hover:text-primary dark:bg-subtle dark:group-hover:bg-primary dark:group-hover:text-white",
                            iconClass,
                            {
                                "!bg-primary !text-white": global.currentPath === href,
                                "opacity-50": href === undefined,
                            },
                        )} />
                    {#if !iconOnly}
                        <span class="min-w-0 truncate">{label}</span>
                    {/if}
                </a>
            {:else}
                <button
                    type="button"
                    class={cn(
                        "group flex min-w-0 items-center gap-2 rounded-[var(--radius)] p-1 hover:text-white/80",
                        iconOnly && "justify-center",
                        klazz,
                    )}
                    on:click={onClick}>
                    <Icon
                        class={cn(
                            "size-8 flex-shrink-0 rounded-md p-1 group-hover:text-primary dark:bg-subtle dark:group-hover:bg-primary dark:group-hover:text-white",
                            iconClass,
                        )} />
                    {#if !iconOnly}
                        <span class="min-w-0 truncate">{label}</span>
                    {/if}
                </button>
            {/if}
        </Tooltip.Trigger>
        <Tooltip.Content side="right">
            <p>{label}</p>
        </Tooltip.Content>
    </Tooltip.Root>
{:else if href}
    <a
        {href}
        class={cn(
            "group flex min-w-0 items-center gap-2 rounded-[var(--radius)] p-1 hover:text-white/80",
            iconOnly && "justify-center",
            klazz,
        )}
        title={iconOnly ? label : undefined}>
        <Icon
            class={cn(
                "size-8 flex-shrink-0 rounded-md p-1 group-hover:text-primary dark:bg-subtle dark:group-hover:bg-primary dark:group-hover:text-white",
                iconClass,
                {
                    "!bg-primary !text-white": global.currentPath === href,
                    "opacity-50": href === undefined,
                },
            )} />
        {#if !iconOnly}
            <span class="min-w-0 truncate">{label}</span>
        {/if}
    </a>
{:else}
    <button
        type="button"
        class={cn(
            "group flex min-w-0 items-center gap-2 rounded-[var(--radius)] p-1 hover:text-white/80",
            iconOnly && "justify-center",
            klazz,
        )}
        title={iconOnly ? label : undefined}
        on:click={onClick}>
        <Icon
            class={cn(
                "size-8 flex-shrink-0 rounded-md p-1 group-hover:text-primary dark:bg-subtle dark:group-hover:bg-primary dark:group-hover:text-white",
                iconClass,
            )} />
        {#if !iconOnly}
            <span class="min-w-0 truncate">{label}</span>
        {/if}
    </button>
{/if}

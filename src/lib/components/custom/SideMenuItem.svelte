<script lang="ts">
    import { cn } from "$src/lib/utils";
    import type { Snippet } from "svelte";
    import Button from "../ui/button/button.svelte";
    import { global } from "$src/lib/states/global.svelte";
    import SquareCard from "./admin/SquareCard.svelte";
    import * as Tooltip from "$lib/components/ui/tooltip";
    type SideMenuItemProps = {
        href?: string;
        class?: string;
        label?: string;
        badge?: string;
        children?: Snippet;
        onClick?: () => void;
        showSquareCard?: boolean;
        collapsed?: boolean;
    };

    let {
        href,
        label,
        badge,
        class: klazz,
        children,
        onClick,
        showSquareCard,
        collapsed = false,
    }: SideMenuItemProps = $props();
</script>

<div class={cn("group/squarecard relative", klazz)}>
    <SquareCard
        class={cn("pointer-events-none absolute inset-0 h-full w-full", {
            hidden: !showSquareCard || global.currentPath !== href,
            "group-hover/squarecard:block": showSquareCard,
        })} />

    {#if collapsed && label}
        <Tooltip.Root>
            <Tooltip.Trigger>
                {#if onClick}
                    <Button
                        variant="ghost"
                        class={cn("flex w-full min-w-0 items-center gap-2 p-2 dark:hover:bg-transparent", klazz)}
                        onclick={onClick}>
                        {#if children}
                            {@render children?.()}
                        {/if}
                        <span class="min-w-0 flex-1 truncate">{label}</span>
                    </Button>
                {:else}
                    <a
                        {href}
                        class={cn(
                            "group flex min-w-0 items-center gap-2 rounded-lg px-1 py-2 text-2xl font-bold",
                            klazz,
                            {
                                "pointer-events-none": href === undefined,
                                "justify-center": collapsed,
                            },
                        )}
                        title={collapsed ? label : undefined}>
                        <div
                            class="h-1/3 w-1 shrink-0 rounded-lg transition-all group-hover:h-2/3 dark:bg-subtle/50 dark:group-hover:bg-primary dark:group-hover:text-white">
                        </div>
                        {#if children}
                            {@render children()}
                        {:else if !collapsed}
                            <span
                                class={cn("min-w-0 flex-1 truncate", {
                                    "!text-primary": global.currentPath === href,
                                    "font-bold": href !== undefined, // Added to emphasize the label when href is present
                                })}>
                                {label}
                            </span>
                        {/if}
                        {#if badge && !collapsed}
                            <span class="shrink-0 rounded-(--radius) py-1 text-2xs uppercase text-primary">
                                {badge}
                            </span>
                        {/if}
                    </a>
                {/if}
            </Tooltip.Trigger>
            <Tooltip.Content side="right">
                <p>{label}</p>
            </Tooltip.Content>
        </Tooltip.Root>
    {:else if onClick}
        <Button
            variant="ghost"
            class={cn("flex w-full min-w-0 items-center gap-2 p-2 dark:hover:bg-transparent", klazz)}
            onclick={onClick}>
            {#if children}
                {@render children?.()}
            {/if}
            <span class="min-w-0 flex-1 truncate">{label}</span>
        </Button>
    {:else}
        <a
            {href}
            class={cn("group flex min-w-0 items-center gap-2 rounded-lg px-1 py-2 text-2xl font-bold", klazz, {
                "pointer-events-none": href === undefined,
                "justify-center": collapsed,
            })}
            title={collapsed ? label : undefined}>
            <div
                class="h-1/3 w-1 shrink-0 rounded-lg transition-all group-hover:h-2/3 dark:bg-subtle/50 dark:group-hover:bg-primary dark:group-hover:text-white">
            </div>
            {#if children}
                {@render children()}
            {:else if !collapsed}
                <span
                    class={cn("min-w-0 flex-1 truncate", {
                        "!text-primary": global.currentPath === href,
                        "font-bold": href !== undefined, // Added to emphasize the label when href is present
                    })}>
                    {label}
                </span>
            {/if}
            {#if badge && !collapsed}
                <span class="shrink-0 rounded-(--radius) py-1 text-2xs uppercase text-primary">{badge}</span>
            {/if}
        </a>
    {/if}
</div>

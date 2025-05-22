<script lang="ts">
    import { cn } from "$src/lib/utils";
    import type { Snippet } from "svelte";
    import Button from "../ui/button/button.svelte";
    import { global } from "$src/lib/states/global.svelte";
    import SquareCard from "./admin/SquareCard.svelte";
    type SideMenuItemProps = {
        href?: string;
        class?: string;
        label?: string;
        badge?: string;
        children?: Snippet;
        onClick?: () => void;
        showSquareCard?: boolean;
    };

    let { href, label, badge, class: klazz, children, onClick, showSquareCard }: SideMenuItemProps = $props();
</script>

<div class={cn("group/squarecard relative", klazz)}>
    <SquareCard
        class={cn("pointer-events-none absolute inset-0 h-full w-full", {
            hidden: !showSquareCard || global.currentPath !== href,
            "group-hover/squarecard:block": showSquareCard,
        })} />
    {#if onClick}
        <Button
            variant="ghost"
            class={cn("flex w-full items-center gap-2 p-2 dark:hover:bg-transparent", klazz)}
            onclick={onClick}>
            {@render children?.()}
            <span>{label}</span>
        </Button>
    {:else}
        <a
            {href}
            class={cn("group flex items-center gap-2 rounded-lg px-1 py-2 text-2xl font-bold ", klazz, {
                "pointer-events-none": href === undefined,
            })}>
            <div
                class="h-1/3 w-1 rounded-lg transition-all group-hover:h-2/3 dark:bg-subtle/50 dark:group-hover:bg-primary dark:group-hover:text-white">
            </div>
            {#if children}
                {@render children()}
            {:else}
                <span
                    class={cn({
                        "!text-primary": global.currentPath === href,

                        "font-bold": href !== undefined, // Added to emphasize the label when href is present
                    })}>
                    {label}
                </span>
            {/if}
            {#if badge}
                <span class="rounded-[var(--radius)] py-1 text-2xs uppercase text-primary">{badge}</span>
            {/if}
        </a>
    {/if}
</div>

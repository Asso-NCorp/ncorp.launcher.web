<script lang="ts">
    import { global } from "$src/lib/states/global.svelte";
    import type { SideMenuSubItemProps } from "$src/lib/types";
    import { cn } from "$src/lib/utils";

    let { href, label, icon: Icon, iconClass, class: klazz, onClick }: SideMenuSubItemProps = $props();
</script>

{#if href}
    <a
        {href}
        class={cn(
            "group flex items-center gap-2 whitespace-nowrap rounded-[var(--radius)] p-1 hover:text-white/80",
            klazz,
        )}>
        <Icon
            class={cn(
                "size-8 rounded-md p-1 group-hover:text-primary dark:bg-subtle dark:group-hover:bg-primary dark:group-hover:text-white",
                iconClass,
                {
                    "!bg-primary !text-white": global.currentPath === href,
                    "opacity-50": href === undefined,
                },
            )} />
        <span>{label}</span>
    </a>
{:else}
    <button
        type="button"
        class={cn(
            "group flex items-center gap-2 whitespace-nowrap rounded-[var(--radius)] p-1 hover:text-white/80",
            klazz,
        )}
        on:click={onClick}>
        <Icon
            class={cn(
                "size-8 rounded-md p-1 group-hover:text-primary dark:bg-subtle dark:group-hover:bg-primary dark:group-hover:text-white",
                iconClass,
            )} />
        <span>{label}</span>
    </button>
{/if}

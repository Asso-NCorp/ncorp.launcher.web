<script lang="ts">
    import type { HTMLInputAttributes } from "svelte/elements";
    import type { WithElementRef } from "bits-ui";
    import type { Icon as LucideIconType } from "@lucide/svelte";
    import { cn } from "$lib/utils.js";

    let {
        ref = $bindable(null),
        value = $bindable(),
        class: className,
        iconClass = "",
        icon: Icon,
        ...restProps
    }: WithElementRef<HTMLInputAttributes> & { icon?: typeof LucideIconType, iconClass?: string } = $props();
</script>


    {#if Icon}
        <!-- Affichage conditionnel de l'icône -->
        <Icon class={cn("absolute left-2.5 top-2.5 size-5 text-muted-foreground", iconClass)} />
    {/if}
    <input
        class:pl-8={Icon != null}
        class={cn(
            "flex h-10 w-full rounded-md border border-input bg-background-darker px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className,
        )}
        bind:this={ref}
        bind:value
        {...restProps} />


<script lang="ts">
    import { cn } from "$lib/utils.js";
    import type { HTMLAttributes } from "svelte/elements";
    import type { WithElementRef } from "bits-ui";
    import Label from "../label/label.svelte";

    let {
        ref = $bindable(null),
        class: className,
        children,
        id,
        title,
        description,
        ...restProps
    }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
        id?: string;
        title: string;
        description?: string;
    } = $props();
</script>

<div bind:this={ref} class={cn("flex w-full items-center justify-between gap-4 py-2", className)} {...restProps}>
    <div class="flex w-full flex-col">
        <Label for={id} class="text-base text-muted-foreground">{title}</Label>
        {#if description}
            <p class="text-sm text-muted-foreground/50">{description}</p>
        {/if}
    </div>
    <div class="flex items-center">
        {@render children?.()}
    </div>
</div>

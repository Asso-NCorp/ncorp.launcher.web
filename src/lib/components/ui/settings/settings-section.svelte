<script lang="ts">
    import { cn } from "$lib/utils.js";
    import type { HTMLAttributes } from "svelte/elements";
    import type { WithElementRef } from "bits-ui";
    import { Separator } from "$lib/components/ui/separator";

    let {
        ref = $bindable(null),
        class: className,
        children,
        title,
        ...restProps
    }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
        title: string;
    } = $props();
</script>

<div
    bind:this={ref}
    class={cn(
        "flex w-full flex-col gap-4",
        className
    )}
    {...restProps}
>
    <div class="flex flex-col gap-1">
        <h3 class="text-lg font-medium">{title}</h3>
        <Separator />
    </div>
    <div class="flex flex-col gap-2">
        {@render children?.()}
    </div>
</div>

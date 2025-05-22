<script lang="ts">
    import { cn } from "$lib/utils";
    import type { Icon } from "@lucide/svelte";
    import type { ComponentType } from "svelte";

    let {
        icon,
        text,
        className,
    }: {
        icon: ComponentType<Icon>;
        text: string | HTMLElement;
        className?: string;
    } = $props();
</script>

<div class={cn("flex items-center justify-center gap-2", className)}>
    <icon class="mr-2 h-6 w-6" />
    <span>{text}</span>
</div>

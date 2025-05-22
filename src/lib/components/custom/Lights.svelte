<script lang="ts">
    import { cn } from "$lib/utils";

    type Direction = "top" | "bottom";

    let { class: className, direction }: { class?: string; direction: Direction } = $props();

    // Reactive variables to adjust gradient and position based on direction
    const gradientDirection = $derived(direction === "top" ? "0deg" : "180deg");
    const positionClass = $derived(direction === "top" ? "top-[-200px]" : "bottom-[-200px]");
</script>

<div id="top-lights" class={cn("pointer-events-none h-full w-full overflow-hidden", className)}>
    <div
        style={`background: conic-gradient(from ${gradientDirection} at 50% 50%, #cf24ff 0deg, #0043ff 180deg, #00bddb 1turn); filter: blur(75px);`}
        class={`relative h-full w-full ${positionClass} opacity-70 dark:opacity-40`}>
    </div>
</div>

<style>
    #top-lights {
        view-transition-name: lights;
    }
</style>

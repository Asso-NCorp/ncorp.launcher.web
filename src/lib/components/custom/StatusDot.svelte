<script lang="ts">
    import { cn } from "$src/lib/utils";
    import type { HubConnectionState } from "@microsoft/signalr";
    import { fly } from "svelte/transition";

    let {
        status,
        class: klazz,
        variant = "overlay",
    }: { status: HubConnectionState | undefined; class?: string; variant?: "overlay" | "inline" } = $props();
</script>

<div
    transition:fly={{ y: -10, duration: 300 }}
    class:bg-green-500={status === "Connected"}
    class:bg-amber-500={status === "Connecting" || status === "Reconnecting"}
    class:bg-zinc-400={status === "Disconnected" || !status}
    class={cn(
        variant === "overlay"
            ? "absolute bottom-0 right-px h-3 w-3 scale-90"
            : "relative inline-block h-3 w-3",
        "rounded-full ring-[2.5px] ring-[hsl(var(--background)/var(--tw-bg-opacity,1))]",
        klazz,
    )} />

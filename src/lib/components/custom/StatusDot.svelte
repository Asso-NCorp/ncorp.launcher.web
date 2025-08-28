<script lang="ts">
    import { cn } from "$src/lib/utils";
    import type { HubConnectionState } from "@microsoft/signalr";
    import { fly } from "svelte/transition";

    let { status, class: klazz }: { status: HubConnectionState | undefined; class?: string } = $props();
</script>

<div
    transition:fly={{ y: -10, duration: 300 }}
    class:bg-green-500={status === "Connected"}
    class:hidden={status == "Disconnected"}
    class={cn(
        "absolute bottom-0 right-[1px] h-3 w-3 scale-90 rounded-full ring-[2.5px] ring-[hsl(var(--background)_/_var(--tw-bg-opacity,1))]",
        klazz,
    )}>
    <!-- Center dot for disconnected state -->
    <div
        class:hidden={status !== "Disconnected"}
        class="absolute inset-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-[hsl(var(--background)_/_var(--tw-bg-opacity,1))]">
    </div>
</div>

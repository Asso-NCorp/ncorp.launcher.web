<script lang="ts">
    import type { UserConnectionType } from "$src/lib/shared-models";
    import { cn } from "$src/lib/utils";
    import * as Tooltip from "$src/lib/components/ui/tooltip";
    import { fly } from "svelte/transition";
    import { Root } from "../ui/button";

    let { status, class: klazz }: { status: UserConnectionType | undefined; class?: string } = $props();
</script>

<Tooltip.Root>
    <Tooltip.Trigger class="absolute -bottom-[2px] -right-[2px] ">
        <div
            transition:fly={{ y: -10, duration: 300 }}
            class:bg-green-500={status === "Full"}
            class:bg-purple-500={status === "LauncherOnly"}
            class:bg-blue-500={status === "AgentOnly"}
            class:hidden={status == "Disconnected"}
            class={cn(
                "h-3 w-3 scale-90 rounded-full ring-[2.5px] ring-[hsl(var(--background)_/_var(--tw-bg-opacity,1))]",
                klazz,
            )}>
            <!-- Center dot for disconnected state -->
            <div
                class:hidden={status === "Full"}
                class="absolute inset-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-[hsl(var(--background)_/_var(--tw-bg-opacity,1))]">
            </div>
        </div>
    </Tooltip.Trigger>
    <Tooltip.Content>
        <Root
            variant="ghost"
            class="z-[9999] cursor-default rounded-md px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground)_/_var(--tw-text-opacity,1))] shadow-md">
            {#if status === "LauncherOnly"}
                Connecté (Launcher uniquement)
            {:else if status === "AgentOnly"}
                Connecté (Agent uniquement)
            {:else if status === "Full"}
                Connecté (Launcher + Agent)
            {:else if status === "Disconnected"}
                Déconnecté
            {/if}
        </Root>
    </Tooltip.Content>
</Tooltip.Root>

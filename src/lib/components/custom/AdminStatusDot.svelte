<script lang="ts">
    import type { LiveUser } from "$src/lib/shared-models";
    import { cn } from "$src/lib/utils";
    import * as Tooltip from "$src/lib/components/ui/tooltip";
    import { fly } from "svelte/transition";
    import { Root } from "../ui/button";

    let { user, class: klazz }: { user: LiveUser; class?: string } = $props();
</script>

<Tooltip.Root>
    <Tooltip.Trigger class="absolute -bottom-[2px] -right-[2px] ">
        <div
            transition:fly={{ y: -10, duration: 300 }}
            class:bg-green-500={user.status === "Full"}
            class:bg-purple-500={user.status === "LauncherOnly"}
            class:bg-blue-500={user.status === "AgentOnly"}
            class:hidden={user.status == "Disconnected"}
            class={cn(
                "h-3 w-3 scale-90 rounded-full ring-[2.5px] ring-[hsl(var(--background)/var(--tw-bg-opacity,1))]",
                klazz,
            )}>
            <!-- Center dot for disconnected state -->
            <div
                class:hidden={user.status === "Full"}
                class="absolute inset-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-[hsl(var(--background)/var(--tw-bg-opacity,1))]">
            </div>
        </div>
    </Tooltip.Trigger>
    <Tooltip.Content>
        <Root
            variant="ghost"
            class="z-9999 cursor-default rounded-md px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground)/var(--tw-text-opacity,1))] shadow-md">
            {#if user.status === "LauncherOnly"}
                <span>Connecté (Launcher uniquement)</span>
            {:else if user.status === "AgentOnly"}
                <span>Connecté (Agent uniquement <span class="text-muted-foreground">v{user?.agentVersion}</span>)</span>
            {:else if user.status === "Full"}
                <span>Connecté (Launcher + Agent <span class="text-muted-foreground">v{user?.agentVersion}</span>)</span>
            {:else if user.status === "Disconnected"}
                <span>Déconnecté</span>
            {/if}
            {#if user.downloadSpeedMegaBytesPerSecond && user.downloadSpeedMegaBytesPerSecond > 0}
                <span>Téléchargement : {user.downloadSpeedMegaBytesPerSecond} Mo/s</span>
            {/if}
        </Root>
    </Tooltip.Content>
</Tooltip.Root>

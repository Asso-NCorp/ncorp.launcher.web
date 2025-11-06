<script lang="ts">
    import { onMount } from "svelte";
    import { ExternalLink } from "@lucide/svelte";
    import * as Card from "$lib/components/ui/card";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import { Skeleton } from "$lib/components/ui/skeleton";
    import { t } from "$lib/translations";
    import { global } from "$lib/states/global.svelte";
    import { cn } from "$lib/utils";
    let loading = $state(true);
    let error = $state<string | null>(null);
    let visibleLinks = $derived.by(() => {
        return global.sideLinks.filter((link) => !link.hidden);
    });

    onMount(async () => {
        await global.refreshSideLinks();
        loading = false;
    });
</script>

{#if visibleLinks.length > 0 || loading}
    <Card.Root class={cn("mb-0 w-full overflow-hidden border-x-0 gap-0! py-2", global.sidebarCollapsed && "mb-2")}>
        <!-- Always show header, but adapt styling -->
        <Card.Header class={cn("px-4 pb-2", global.sidebarCollapsed && "px-2 pb-2")}>
            <Card.Title class={cn("text-sm font-medium", global.sidebarCollapsed && "text-center text-xs")}>
                {global.sidebarCollapsed ? "Liens" : $t("quick_links")}
            </Card.Title>
        </Card.Header>
        <Card.Content class={cn("px-4 py-2", global.sidebarCollapsed && "px-2 py-2")}>
            {#if loading}
                <div class="space-y-2">
                    <Skeleton class={cn("h-6 w-full", global.sidebarCollapsed && "h-4")} />
                    <Skeleton class={cn("h-6 w-full", global.sidebarCollapsed && "h-4")} />
                </div>
            {:else if error}
                <p class={cn("text-sm text-destructive", global.sidebarCollapsed && "text-center text-xs")}>
                    {global.sidebarCollapsed ? "!" : error}
                </p>
            {:else}
                <div class={cn("flex gap-0", global.sidebarCollapsed ? "flex-col items-center" : "flex-col")}>
                    {#each visibleLinks as link}
                        {#if global.sidebarCollapsed}
                            <!-- Collapsed: show only icons with tooltips -->
                            <Tooltip.Root>
                                <Tooltip.Trigger>
                                    <a
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground">
                                        <ExternalLink class="h-4 w-4" />
                                    </a>
                                </Tooltip.Trigger>
                                <Tooltip.Content side="right">
                                    <p>{link.name}</p>
                                </Tooltip.Content>
                            </Tooltip.Root>
                        {:else}
                            <!-- Expanded: show full layout -->
                            <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="flex items-center gap-2 rounded-md py-1 px-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                                <ExternalLink class="size-4 shrink-0" />
                                <span class="truncate">{link.name}</span>
                            </a>
                        {/if}
                    {/each}
                </div>
            {/if}
        </Card.Content>
    </Card.Root>
{/if}

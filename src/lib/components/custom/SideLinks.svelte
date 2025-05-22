<script lang="ts">
    import { onMount } from "svelte";
    import { ExternalLink } from "@lucide/svelte";
    import * as Card from "$lib/components/ui/card";
    import { Skeleton } from "$lib/components/ui/skeleton";
    import { t } from "$lib/translations";
    import { global } from "$lib/states/global.svelte";
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
    <Card.Root class="mb-4 w-full overflow-hidden border-x-0">
        <Card.Header class="p-3 pb-0">
            <Card.Title class="text-sm font-medium">{$t("quick_links")}</Card.Title>
        </Card.Header>
        <Card.Content class="p-3 pt-2">
            {#if loading}
                <div class="space-y-2">
                    <Skeleton class="h-6 w-full" />
                    <Skeleton class="h-6 w-full" />
                </div>
            {:else if error}
                <p class="text-sm text-destructive">{error}</p>
            {:else}
                <div class="flex flex-col gap-1">
                    {#each visibleLinks as link}
                        <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="flex items-center gap-2 rounded-md p-1 text-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                            <ExternalLink class="size-4" />
                            <span class="truncate">{link.name}</span>
                        </a>
                    {/each}
                </div>
            {/if}
        </Card.Content>
    </Card.Root>
{/if}

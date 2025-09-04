<script lang="ts">
    import { Users, Hash } from "@lucide/svelte";
    const { title = "", subtitle = "" } = $props<{ title?: string; subtitle?: string }>();
</script>

<header class="flex h-12 items-center gap-2 border-b px-4">
    <Hash class="h-4 w-4 opacity-60" />
    <h2 class="text-sm font-semibold">{title}</h2>
    {#if subtitle}
        <span class="text-xs text-muted-foreground">— {subtitle}</span>
    {/if}
    <div class="ml-auto flex items-center gap-2 text-muted-foreground">
        <Users class="h-4 w-4" />
    </div>
</header>

<script lang="ts">
    import { cn } from "$src/lib/utils";
    import NcorpGlitch from "$src/lib/components/custom/NcorpGlitch.svelte";
    import { version } from "$lib/version";
    import { global } from "$src/lib/states/global.svelte";
</script>

<div
    class:w-20={global.sidebarCollapsed}
    class:w-64={!global.sidebarCollapsed}
    class="border-border bg-card flex items-center justify-center gap-2 border-r border-b transition-all duration-300 ease-in-out">
    <img
        src="/logo_small.png"
        alt="Logo"
        class={cn("h-10 w-auto transition-all duration-300", {
            "h-8": global.sidebarCollapsed,
        })} />

    {#if !global.sidebarCollapsed}
        <div class="bg-border h-8 w-px" />
        <NcorpGlitch
            class="font-clash inline-block text-lg font-semibold tracking-widest"
            text="LAUNCHER"
            glitchEnabled={false} />
        <span class="text-muted-foreground text-xs">v{version}</span>
    {/if}
</div>

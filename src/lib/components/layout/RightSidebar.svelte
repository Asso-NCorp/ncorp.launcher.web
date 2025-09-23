<script lang="ts">
    import LiveUsers from "$src/lib/components/custom/LiveUsers.svelte";
</script>

<aside
    class="right-sidebar border-border bg-card h-full min-h-0 w-68 shrink-0 border-l transition-all duration-300 ease-in-out">
    <div class="flex h-full min-h-0 flex-col">
        <LiveUsers class="h-full" />
        <div class="mt-auto flex items-center justify-center gap-2 border-t py-2">
            <a
                href="https://ko-fi.com/keytrap"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2">
                <img src="/img/kofi.webp" alt="Ko-Fi" class="h-4 w-4" />
                <span class="text-muted-foreground text-xs">Offrir un kawa au dev ☕</span>
            </a>
        </div>
    </div>
</aside>

<style>
    aside {
        view-transition-name: right-sidebar;
    }
</style>

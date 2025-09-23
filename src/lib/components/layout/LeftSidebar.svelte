<script lang="ts">
    import SideMenu from "$src/lib/components/custom/SideMenu.svelte";
    import ProfileDropdown from "$src/lib/components/custom/dropdowns/ProfileDropdown.svelte";
    import { global } from "$src/lib/states/global.svelte";
    import { liveUsers } from "$src/lib/states/live-users.svelte";

    let { userId }: { userId?: string } = $props();
</script>

<aside
    class="left-sidebar bg-card h-full min-h-0 shrink-0 border-r transition-[width] duration-200 ease-in-out"
    class:w-20={global.sidebarCollapsed}
    class:w-64={!global.sidebarCollapsed}>
    <div class="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
        <SideMenu class="min-h-0 flex-1" />
        <div class="bg-card relative z-10 flex h-auto items-center justify-center gap-2 border-t py-1">
            <ProfileDropdown user={liveUsers.getUser(userId!)} />
        </div>
    </div>
</aside>

<style>
    aside {
        view-transition-name: left-sidebar;
    }
</style>

<script lang="ts">
    import type { PageData } from "./$types";
    import UserList from "$src/lib/components/custom/admin/UserList.svelte";
    import BlurFade from "$src/lib/components/custom/BlurFade.svelte";
    import AddUserForm from "./add-user-form.svelte";
    import EditUserForm from "./edit-user-form.svelte";
    import { onMount } from "svelte";
    import type { User } from "$src/lib/auth/client";
    import { t } from "$src/lib/translations";
    // import { invalidateAll } from "$app/navigation";
    let { data }: { data: PageData } = $props();
    let users = $state(data.users);
    let selectedUser: User | null = $state(null);

    // Update users when data changes
    $effect(() => {
        users = data.users;
    });

    onMount(() => {
        // Listen for the clearSelection event
        const handleClearSelection = () => {
            selectedUser = null;
        };
        document.addEventListener("clearSelection", handleClearSelection);

        return () => {
            document.removeEventListener("clearSelection", handleClearSelection);
        };
    });
</script>

<main class="flex h-full flex-col space-y-4">
    <BlurFade delay={0.3} class="text-3xl font-bold">{$t("users_management")}</BlurFade>
    <div class="grid grid-cols-3 gap-8">
        <div class="col-span-1">
            <UserList {users} loading={false} onSelect={(user) => (selectedUser = user)} />
        </div>

        <div class="col-span-2">
            {#if selectedUser}
                <EditUserForm data={{ editForm: data.editForm }} user={selectedUser} />
            {:else}
                <AddUserForm data={{ addForm: data.addForm }} />
            {/if}
        </div>
    </div>
</main>

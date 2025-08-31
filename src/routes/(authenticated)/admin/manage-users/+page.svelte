<script lang="ts">
    import type { PageData } from "./$types";
    import UserList from "$src/lib/components/custom/admin/UserList.svelte";
    import BlurFade from "$src/lib/components/custom/BlurFade.svelte";
    import AddUserForm from "./add-user-form.svelte";
    import EditUserForm from "./edit-user-form.svelte";
    import { onMount } from "svelte";
    import type { User } from "$src/lib/auth/client";
    import { t } from "$src/lib/translations";
    import { getServerApi } from "$src/lib/utils";
    import { liveUsers } from "$src/lib/states/live-users.svelte";
    // import { invalidateAll } from "$app/navigation";
    let { data }: { data: PageData } = $props();
    let users = $state(data.users);
    let selectedUser: User | null = $state(null);

    // Update users when data changes
    $effect(() => {
        users = data.users;
    });

    const handleFormSubmit = async () => {
       await liveUsers.refreshLiveUsers();
    }

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
    <div class="flex gap-8">
        <div class="w-2/3">
            <UserList bind:users loading={false} onSelect={(user) => (selectedUser = user)} />
        </div>

        <div class="w-1/3">
            {#if selectedUser}
                <EditUserForm data={{ editForm: data.editForm }} user={selectedUser} onSubmit={handleFormSubmit} />
            {:else}
                <AddUserForm data={{ addForm: data.addForm }} onSubmit={handleFormSubmit} />
            {/if}
        </div>
    </div>
</main>

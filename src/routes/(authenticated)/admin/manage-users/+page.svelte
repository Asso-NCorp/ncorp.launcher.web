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
    import * as Card from "$lib/components/ui/card";
    import { Users, Plus } from "@lucide/svelte";
    // import { invalidateAll } from "$app/navigation";
    let { data }: { data: PageData } = $props();
    let users = $state(data.users);
    let selectedUser: User | null = $state(null);
    let showAddForm = $state(false);

    // Update users when data changes
    $effect(() => {
        users = data.users;
    });

    const handleFormSubmit = async () => {
       await liveUsers.refreshLiveUsers();
       showAddForm = false;
    }

    const handleSelectUser = (user: User) => {
        selectedUser = user;
        showAddForm = false;
    };

    const handleShowAddForm = () => {
        showAddForm = true;
        selectedUser = null;
    };

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

<main class="flex h-full flex-col space-y-6 p-6">
    <!-- Header Section -->
    <div class="space-y-2">
        <div class="flex items-center gap-3">
            <div class="rounded-lg bg-linear-to-br from-primary/20 to-primary/10 p-2">
                <Users class="size-6 text-primary" />
            </div>
            <BlurFade delay={0.2} class="text-3xl font-bold">{$t("users_management")}</BlurFade>
        </div>
        <p class="text-sm text-muted-foreground">Gérez les utilisateurs et leurs rôles</p>
    </div>

    <!-- Stats Section -->
    <div class="grid grid-cols-3 gap-4">
        <Card.Root>
            <Card.Content class="pt-6">
                <div class="space-y-2">
                    <p class="text-sm font-medium text-muted-foreground">Total d'utilisateurs</p>
                    <p class="text-2xl font-bold">{users.length}</p>
                </div>
            </Card.Content>
        </Card.Root>
        <Card.Root>
            <Card.Content class="pt-6">
                <div class="space-y-2">
                    <p class="text-sm font-medium text-muted-foreground">Admins</p>
                    <p class="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
                </div>
            </Card.Content>
        </Card.Root>
        <Card.Root>
            <Card.Content class="pt-6">
                <div class="space-y-2">
                    <p class="text-sm font-medium text-muted-foreground">Utilisateurs</p>
                    <p class="text-2xl font-bold">{users.filter(u => u.role !== 'admin').length}</p>
                </div>
            </Card.Content>
        </Card.Root>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-3 gap-6 flex-1">
        <!-- Users List -->
        <div class="col-span-2 min-h-0">
            <Card.Root class="h-full flex flex-col">
                <Card.Header class="border-b">
                    <div class="flex items-center justify-between">
                        <Card.Title>Liste des utilisateurs</Card.Title>
                        <button
                            on:click={handleShowAddForm}
                            class="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            <Plus class="size-4" />
                            Ajouter
                        </button>
                    </div>
                </Card.Header>
                <Card.Content class="flex-1 overflow-auto p-0">
                    <UserList bind:users loading={false} onSelect={handleSelectUser} roles={data.roles} />
                </Card.Content>
            </Card.Root>
        </div>

        <!-- Side Panel -->
        <div class="min-h-0">
            {#if showAddForm}
                <AddUserForm data={{ addForm: data.addForm }} onSubmit={handleFormSubmit} />
            {:else if selectedUser}
                <EditUserForm data={{ editForm: data.editForm }} user={selectedUser} onSubmit={handleFormSubmit} />
            {:else}
                <Card.Root class="sticky top-4 flex h-fit flex-col items-center justify-center py-12 px-4 text-center">
                    <div class="rounded-full bg-muted p-3 mb-4">
                        <Users class="size-6 text-muted-foreground" />
                    </div>
                    <h3 class="text-lg font-semibold">Sélectionnez un utilisateur</h3>
                    <p class="mt-2 text-sm text-muted-foreground">
                        Cliquez sur un utilisateur dans la liste pour le modifier ou créer un nouvel utilisateur
                    </p>
                </Card.Root>
            {/if}
        </div>
    </div>
</main>

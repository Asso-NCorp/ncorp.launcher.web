<script lang="ts">
    import { Skeleton } from "$lib/components/ui/skeleton";
    import { authClient, type User } from "$src/lib/auth/client";
    import * as Table from "$lib/components/ui/table/index.js";
    import * as Popover from "$lib/components/ui/popover/index.js";
    import Button from "$lib/components/ui/button/button.svelte";
    import { buttonVariants } from "$lib/components/ui/button/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Trash2 } from "@lucide/svelte";
    import { toast } from "svelte-sonner";

    let {
        loading,
        users = $bindable(),
        onSelect,
    }: { loading: boolean; users: User[]; onSelect: (user: User) => void } = $props();

    let searchQuery = $state("");
    let popoverStates: Record<string, boolean> = {};

    const filteredUsers = $derived(
        users.filter((user) =>
            user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.role?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    $effect(() => {
        if (users && users.length > 0) {
            const newStates: Record<string, boolean> = {};
            users.forEach((user: User) => {
                newStates[user.id] = false;
            });
            popoverStates = newStates;
        }
    });

    function closePopover(userId: string) {
        popoverStates[userId] = false;
    }

    const handleDelete = async (user: User) => {
        try {
            await authClient.admin.removeUser({
                userId: user.id,
            });
            closePopover(user.id);
            toast.success("Utilisateur supprimé avec succès", {
                class: "bg-green-500",
            });
            // Refresh users list
            window.location.reload();
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error("Erreur lors de la suppression de l'utilisateur", {
                class: "bg-red-500",
            });
        }
    };

    const localDateTime = (date: string) => {
        const d = new Date(date);
        d.setHours(d.getHours() + 2);
        return d.toLocaleString();
    };
</script>

{#if loading}
    <Skeleton />
{:else}
    <div class="h-full w-full flex flex-col overflow-hidden space-y-4">
        <!-- Search Bar -->
        <div class="shrink-0 flex justify-center">
            <Input
                type="text"
                placeholder="Rechercher un utilisateur..."
                bind:value={searchQuery}
                class="w-1/2"
            />
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto">
            <Table.Root class="border">
                <Table.Header class="bg-muted/30 sticky top-0">
                    <Table.Row>
                        <Table.Head class="w-10"></Table.Head>
                        <Table.Head class="w-2/5">Utilisateur</Table.Head>
                        <Table.Head class="w-1/6 text-center">Rôle</Table.Head>
                        <Table.Head class="w-1/6 text-center">Date d'inscription</Table.Head>
                        <Table.Head class="w-1/6 text-center">Dernière connexion</Table.Head>
                        <Table.Head class="w-12 text-right">Actions</Table.Head>
                    </Table.Row>
                </Table.Header>
                <Table.Body class="divide-y divide-border">
                    {#each filteredUsers as user (user.id)}
                        <Table.Row
                            class="cursor-pointer hover:bg-muted/50 transition-colors group"
                            onclick={() => onSelect(user)}
                        >
                            <Table.Cell class="p-2">
                                <img
                                    src="/api/avatars/{user.id}"
                                    alt={user.name}
                                    class="size-8 rounded-full ring-2 ring-primary object-cover"
                                />
                            </Table.Cell>
                            <Table.Cell class="font-medium">
                                <div>{user.name}</div>
                                <div class="text-xs text-muted-foreground">{user.email}</div>
                            </Table.Cell>
                            <Table.Cell class="text-center text-sm">
                                {user.role}
                            </Table.Cell>
                            <Table.Cell class="text-center text-sm">
                                {new Date(user.createdAt).toLocaleDateString()}
                            </Table.Cell>
                            <Table.Cell class="text-center text-sm">
                                {user.lastLogin ? localDateTime(user.lastLogin) : "Jamais"}
                            </Table.Cell>
                            <Table.Cell class="text-right p-2">
                                <Popover.Root
                                    open={popoverStates[user.id] === true}
                                    onOpenChange={(isOpen) => {
                                        popoverStates[user.id] = isOpen;
                                    }}
                                >
                                    <Popover.Trigger class={buttonVariants({ variant: "ghost", size: "sm" })} onclick={(e) => e.stopPropagation()}>
                                        <Trash2 class="size-4 text-destructive" />
                                    </Popover.Trigger>
                                    <Popover.Content class="w-56">
                                        <div class="flex flex-col gap-3">
                                            <div>
                                                <span class="font-semibold block">Êtes-vous sûr ?</span>
                                                <span class="text-sm text-muted-foreground">Cette action est irréversible.</span>
                                            </div>
                                            <div class="flex gap-2 justify-end">
                                                <Popover.Close>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onclick={() => closePopover(user.id)}
                                                    >
                                                        Annuler
                                                    </Button>
                                                </Popover.Close>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onclick={() => handleDelete(user)}
                                                >
                                                    Supprimer
                                                </Button>
                                            </div>
                                        </div>
                                    </Popover.Content>
                                </Popover.Root>
                            </Table.Cell>
                        </Table.Row>
                    {/each}
                </Table.Body>
            </Table.Root>
        </div>
    </div>
{/if}

<style>
    :global(table) {
        width: 100%;
        table-layout: fixed;
    }
</style>

<script lang="ts">
    import { Skeleton } from "$lib/components/ui/skeleton";
    import * as Table from "$lib/components/ui/table/index.js";
    import * as Avatar from "$lib/components/ui/avatar/index.js";
    import { authClient, type User } from "$src/lib/auth/client";
    import Button from "../../ui/button/button.svelte";
    import * as Popover from "$lib/components/ui/popover/index.js";
    import { liveUsers } from "$src/lib/states/live-users.svelte";
    let { loading, users, onSelect }: { loading: boolean; users: User[]; onSelect: (user: User) => void } = $props();

    const handleDelete = async (user: User) => {
        await authClient.admin.removeUser({
            userId: user.id,
        });

        await liveUsers.refreshLiveUsers();
    };
</script>

<div class="h-full w-full">
    {#if loading}
        <Skeleton />
    {:else}
        <span>Sélectionnez un utilisateur</span>
        <Table.Root>
            <Table.Header>
                <Table.Row>
                    <Table.Head class="w-10"></Table.Head>
                    <Table.Head>Utilisateur</Table.Head>
                    <Table.Head class="text-right">Rôle</Table.Head>
                    <Table.Head class="text-right"></Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#each users as user (user)}
                    <Table.Row class="cursor-pointer" onclick={() => onSelect(user)}>
                        <Table.Cell>
                            <Avatar.Root class="size-8 ring-primary">
                                <Avatar.Image src="/api/avatars/{user.id}" alt={user.name} />
                                <Avatar.Fallback>{user.name?.charAt(0)}{user.name?.charAt(1)}</Avatar.Fallback>
                            </Avatar.Root>
                        </Table.Cell>
                        <Table.Cell class="font-medium">{user.name}</Table.Cell>
                        <Table.Cell class="text-right">{user.role}</Table.Cell>
                        <Table.Cell class="text-right">
                            <Popover.Root>
                                <Popover.Trigger class="text-destructive-foreground">
                                    <Button variant="outline">Supprimer</Button>
                                </Popover.Trigger>
                                <Popover.Content>
                                    <div class="flex flex-col gap-2">
                                        <span>Êtes-vous sûr ?</span>
                                        <span>Cette action est irréversible.</span>
                                        <div class="flex gap-2">
                                            <Button variant="outline">Annuler</Button>
                                            <Button variant="destructive" onclick={() => handleDelete(user)}>
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
    {/if}
</div>

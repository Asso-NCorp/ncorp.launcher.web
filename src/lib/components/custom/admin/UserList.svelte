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
    import { Badge } from "$lib/components/ui/badge";
    import AvatarWithStatus from "$lib/components/custom/AvatarWithStatus.svelte";
    import type { role } from "@prisma/client";

    interface UserWithApproval extends User {
        approvalStatus?: string;
    }

    let {
        loading,
        users = $bindable(),
        onSelect,
        roles = [],
    }: { loading: boolean; users: UserWithApproval[]; onSelect: (user: UserWithApproval) => void; roles: role[] } = $props();

    let searchQuery = $state("");
    let popoverStates: Record<string, boolean> = {};

    // Helper to get avatar decoration
    const getAvatarDecoration = (userRole: string | null | undefined): string | undefined => {
        if (!userRole) return undefined;
        const roleData = roles.find((r) => r.name === userRole);
        return roleData?.avatar_decoration_static ?? roleData?.avatar_decoration_animated ?? undefined;
    };

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
                        <Table.Head class="w-[50px]"></Table.Head>
                        <Table.Head class="w-[35%]">Utilisateur</Table.Head>
                        <Table.Head class="w-[12%] text-center">Rôle</Table.Head>
                        <Table.Head class="w-[18%] text-center">Approbation</Table.Head>
                        <Table.Head class="w-[20%] text-center">Date d'inscription</Table.Head>
                        <Table.Head class="w-[50px] text-right">Actions</Table.Head>
                    </Table.Row>
                </Table.Header>
                <Table.Body class="divide-y divide-border">
                    {#each filteredUsers as user (user.id)}
                        <Table.Row
                            class="cursor-pointer hover:bg-muted/50 transition-colors group"
                            onclick={() => onSelect(user)}
                        >
                            <Table.Cell class="w-[50px] p-2">
                                <AvatarWithStatus
                                    user={{
                                        ...user,
                                        status: "Disconnected" as const,
                                        isSpeaking: false,
                                        activity: undefined,
                                        gameInstallProgress: 0,
                                    } as any}
                                    decorationSrc={getAvatarDecoration(user.role)}
                                    showStatusDot={false}
                                    size={32}
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
                                {#if user.approvalStatus === "pending"}
                                    <Badge variant="outline" class="bg-yellow-500/10 text-yellow-700 border-yellow-200">En attente</Badge>
                                {:else if user.approvalStatus === "approved"}
                                    <Badge variant="outline" class="bg-green-500/10 text-green-700 border-green-200">Approuvé</Badge>
                                {:else if user.approvalStatus === "rejected"}
                                    <Badge variant="outline" class="bg-red-500/10 text-red-700 border-red-200">Rejeté</Badge>
                                {/if}
                            </Table.Cell>
                            <Table.Cell class="text-center text-sm">
                                {new Date(user.createdAt).toLocaleDateString()}
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

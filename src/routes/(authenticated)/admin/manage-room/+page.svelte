<script lang="ts">
    import { onMount } from "svelte";
    import { tablePlanState } from "$lib/states/table-plan.svelte";
    import TablePlanCanvas from "$lib/components/table-plan/TablePlanCanvas.svelte";
    import AddTableDialog from "$lib/components/table-plan/AddTableDialog.svelte";
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Plus, Trash2 } from "@lucide/svelte";
    import { t } from "$lib/translations";
    import { cn } from "$lib/utils";

    let editions = $state<any[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);
    let users = $state<any[]>([]);

    let showAddEditionDialog = $state(false);
    let showAddRoomDialog = $state(false);
    let showDeleteEditionConfirm = $state(false);
    let newEditionName = $state("");
    let newEditionStartDate = $state("");
    let newEditionEndDate = $state("");
    let newRoomName = $state("");

    onMount(async () => {
        await loadEditions();
        await loadUsers();
    });

    async function loadUsers() {
        try {
            const res = await fetch("/api/users");
            if (res.ok) {
                users = await res.json();
            }
        } catch (err) {
            console.error("Error loading users:", err);
        }
    }

    async function loadEditions() {
        try {
            const res = await fetch("/api/admin/editions");
            if (!res.ok) throw new Error("Failed to fetch editions");
            editions = await res.json();
            if (editions.length > 0) {
                tablePlanState.setCurrentEdition(editions[0]);
            }
        } catch (err) {
            error = err instanceof Error ? err.message : t.get("failed_to_load_editions");
        } finally {
            loading = false;
        }
    }

    async function handleAddEdition() {
        if (!newEditionName.trim()) return;

        try {
            const res = await fetch("/api/admin/editions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newEditionName,
                    description: "",
                    startDate: newEditionStartDate || undefined,
                    endDate: newEditionEndDate || undefined,
                }),
            });
            if (res.ok) {
                newEditionName = "";
                newEditionStartDate = "";
                newEditionEndDate = "";
                showAddEditionDialog = false;
                await loadEditions();
            }
        } catch (err) {
            console.error("Error adding edition:", err);
        }
    }

    async function handleAddRoom() {
        if (!newRoomName.trim() || !tablePlanState.currentEdition) return;

        try {
            const res = await fetch(`/api/admin/editions/${tablePlanState.currentEdition.id}/rooms`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newRoomName }),
            });
            if (res.ok) {
                const newRoom = await res.json();
                newRoomName = "";
                showAddRoomDialog = false;
                // Refresh current edition
                const editionRes = await fetch(`/api/admin/editions/${tablePlanState.currentEdition.id}`);
                const updated = await editionRes.json();
                tablePlanState.setCurrentEditionPreservingRoom(updated);
                // Select the newly created room
                const createdRoom = updated.rooms.find((r: any) => r.id === newRoom.id);
                if (createdRoom) {
                    tablePlanState.setCurrentRoom(createdRoom);
                }
            }
        } catch (err) {
            console.error("Error adding room:", err);
        }
    }

    async function handleDeleteRoom(roomId: string) {
        if (!confirm(t.get("delete_table"))) return;

        try {
            const res = await fetch(`/api/admin/editions/${tablePlanState.currentEdition?.id}/rooms/${roomId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                // Refresh and reset
                if (tablePlanState.currentRoom?.id === roomId) {
                    tablePlanState.setCurrentRoom(null);
                }
                const editionRes = await fetch(`/api/admin/editions/${tablePlanState.currentEdition?.id}`);
                const updated = await editionRes.json();
                tablePlanState.setCurrentEdition(updated);
            }
        } catch (err) {
            console.error("Error deleting room:", err);
        }
    }

    async function handleDeleteTable(tableId: string) {
        if (!confirm(t.get("delete_table"))) return;

        try {
            const res = await fetch(
                `/api/admin/editions/${tablePlanState.currentEdition?.id}/rooms/${tablePlanState.currentRoom?.id}/tables/${tableId}`,
                { method: "DELETE" },
            );

            if (!res.ok) {
                const errorText = await res.text();
                console.error("Delete response status:", res.status, "Text:", errorText);

                // If 401 or redirected to signin, redirect to login
                if (res.status === 401 || res.redirected) {
                    window.location.href = "/signin";
                    return;
                }
                throw new Error(`Delete failed: ${res.status}`);
            }

            if (res.ok) {
                // Clear selected table if it was the one deleted
                if (tablePlanState.selectedTableId === tableId) {
                    tablePlanState.setSelectedTable(null);
                }
                // Refresh entire edition to update room table count in sidebar
                const editionRes = await fetch(`/api/admin/editions/${tablePlanState.currentEdition?.id}`);
                if (!editionRes.ok) {
                    if (editionRes.status === 401 || editionRes.redirected) {
                        window.location.href = "/signin";
                        return;
                    }
                }
                const updated = await editionRes.json();
                // Use new method to preserve current room selection
                tablePlanState.setCurrentEditionPreservingRoom(updated);
            }
        } catch (err) {
            console.error("Error deleting table:", err);
        }
    }

    function switchRoom(room: any) {
        tablePlanState.setCurrentRoom(room);
    }

    async function handleSwitchEdition(editionId: string) {
        try {
            const res = await fetch(`/api/admin/editions/${editionId}`);
            if (res.ok) {
                const edition = await res.json();
                tablePlanState.setCurrentEdition(edition);
            }
        } catch (err) {
            console.error("Error switching edition:", err);
        }
    }

    async function handleDeleteEdition() {
        if (!tablePlanState.currentEdition) return;
        if (
            !confirm(
                `${t.get("delete_edition")} "${tablePlanState.currentEdition.name}"? ${t.get("this_cannot_be_undone")}`,
            )
        )
            return;

        try {
            const res = await fetch(`/api/admin/editions/${tablePlanState.currentEdition.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                showDeleteEditionConfirm = false;
                // Reset current edition and room
                tablePlanState.setCurrentEdition(null);
                tablePlanState.setCurrentRoom(null);
                await loadEditions();
            }
        } catch (err) {
            console.error("Error deleting edition:", err);
        }
    }
</script>

<div class="bg-background flex h-full flex-col gap-4 p-6">
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-foreground text-3xl font-bold">{t.get("table_plan_manager")}</h1>
            <p class="text-muted-foreground">
                {#if tablePlanState.currentEdition}
                    {t.get("edition")}: {tablePlanState.currentEdition.name}
                {:else}
                    {t.get("no_edition_selected")}
                {/if}
            </p>
        </div>
        <div class="flex gap-2">
            <button
                onclick={() => (showAddEditionDialog = true)}
                class={buttonVariants({ variant: "default" })}
                title={t.get("add_edition")}>
                + {t.get("edition")}
            </button>
            {#if tablePlanState.currentEdition}
                <Button variant="destructive" onclick={() => handleDeleteEdition()} title={t.get("delete_edition")}>
                    <Trash2 size={18} class="mr-2" />
                    {t.get("delete_edition")}
                </Button>
            {/if}
        </div>
    </div>

    <!-- Edition selector -->
    {#if !loading && editions.length > 0}
        <div class="flex gap-2 overflow-x-auto pb-2">
            {#each editions as edition (edition.id)}
                <Button
                    onclick={() => handleSwitchEdition(edition.id)}
                    variant={tablePlanState.currentEdition?.id === edition.id ? "default" : "outline"}
                    class="whitespace-nowrap">
                    {edition.name}
                </Button>
            {/each}
        </div>
    {/if}

    {#if error}
        <div class="border-destructive/50 bg-destructive/10 text-destructive rounded-md border p-4">
            {error}
        </div>
    {/if}

    {#if loading}
        <div class="flex h-96 items-center justify-center">
            <p class="text-muted-foreground">{t.get("loading")}</p>
        </div>
    {:else if editions.length === 0}
        <div class="flex flex-1 flex-col items-center justify-center gap-6">
            <div class="text-center">
                <h2 class="text-foreground mb-2 text-2xl font-semibold">{t.get("no_edition_selected")}</h2>
                <p class="text-muted-foreground mb-6">{t.get("create_your_first_edition")}</p>
            </div>
        </div>
    {:else if tablePlanState.currentEdition}
        <div class="flex h-[calc(100%-200px)] gap-4">
            <!-- Sidebar -->
            <div class="flex w-64 flex-col gap-4 overflow-hidden">
                <!-- Rooms -->
                <div class="border-border bg-card flex-1 overflow-y-auto rounded-lg border p-4">
                    <div class="mb-3 flex items-center justify-between">
                        <h2 class="text-card-foreground font-semibold">{t.get("rooms")}</h2>
                        <Dialog.Root bind:open={showAddRoomDialog}>
                            <Dialog.Trigger
                                class={buttonVariants({ variant: "ghost", size: "sm" })}
                                title={t.get("add_room")}>
                                <Plus size={16} />
                            </Dialog.Trigger>
                            <Dialog.Content class="sm:max-w-[425px]">
                                <Dialog.Header>
                                    <Dialog.Title>{t.get("add_room")}</Dialog.Title>
                                    <Dialog.Description>
                                        {t.get("room_name")}
                                    </Dialog.Description>
                                </Dialog.Header>
                                <div class="grid gap-4 py-4">
                                    <div class="grid gap-2">
                                        <Label for="room-name">{t.get("room_name")}</Label>
                                        <Input
                                            id="room-name"
                                            placeholder={t.get("room_name")}
                                            bind:value={newRoomName}
                                            onkeydown={(e) => {
                                                if (e.key === "Enter") handleAddRoom();
                                            }} />
                                    </div>
                                </div>
                                <Dialog.Footer>
                                    <Button type="button" onclick={handleAddRoom}>
                                        {t.get("save")}
                                    </Button>
                                </Dialog.Footer>
                            </Dialog.Content>
                        </Dialog.Root>
                    </div>
                    <div class="space-y-2">
                        {#each tablePlanState.currentEdition.rooms as room (room.id)}
                            <div class="group flex items-center gap-1">
                                <button
                                    onclick={() => switchRoom(room)}
                                    class={cn(
                                        "flex-1 rounded-md border px-3 py-2 text-left transition-colors",
                                        tablePlanState.currentRoom?.id === room.id
                                            ? "bg-primary/20 border-primary text-card-foreground"
                                            : "text-card-foreground border-transparent bg-transparent",
                                    )}>
                                    <p class="font-medium">{room.name}</p>
                                    <p class="text-muted-foreground text-xs">
                                        {room.tables.length}
                                        {t.get("tables")}
                                    </p>
                                </button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    class="text-destructive hover:text-destructive h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                                    onclick={() => handleDeleteRoom(room.id)}
                                    title={t.get("delete_table")}>
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>

            <!-- Canvas -->
            <div class="flex flex-1 flex-col gap-4">
                <div class="flex items-center justify-between gap-4">
                    <p class="text-muted-foreground text-sm">
                        {t.get("rooms")}: {tablePlanState.currentRoom?.name || t.get("no_room_selected")}
                    </p>
                    {#if tablePlanState.currentRoom}
                        <AddTableDialog />
                    {/if}
                </div>
                <div class="border-border flex-1 overflow-hidden rounded-lg border">
                    <TablePlanCanvas room={tablePlanState.currentRoom} onDeleteTable={handleDeleteTable} {users} />
                </div>
            </div>
        </div>
    {/if}
</div>

<!-- Add Edition Dialog (always available) -->
<Dialog.Root bind:open={showAddEditionDialog}>
    <Dialog.Content class="sm:max-w-[500px]">
        <Dialog.Header>
            <Dialog.Title>{t.get("edition")}</Dialog.Title>
            <Dialog.Description>
                {t.get("add_room")}
            </Dialog.Description>
        </Dialog.Header>
        <div class="grid gap-4 py-4">
            <div class="grid gap-2">
                <Label for="edition-name">{t.get("edition")}</Label>
                <Input id="edition-name" placeholder={t.get("edition")} bind:value={newEditionName} />
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="grid gap-2">
                    <Label for="edition-start-date">{t.get("start_date")}</Label>
                    <Input id="edition-start-date" type="date" bind:value={newEditionStartDate} />
                </div>
                <div class="grid gap-2">
                    <Label for="edition-end-date">{t.get("end_date")}</Label>
                    <Input id="edition-end-date" type="date" bind:value={newEditionEndDate} />
                </div>
            </div>
        </div>
        <Dialog.Footer>
            <Button type="button" onclick={handleAddEdition}>
                {t.get("save")}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { tablePlanState } from "$lib/states/table-plan.svelte";
    import { t } from "$lib/translations";
    import { Plus } from "@lucide/svelte";
    import UserSearch from "./UserSearch.svelte";

    interface User {
        id: string;
        name: string;
        role: string;
        image?: string;
    }

    let tableName = $state("Table");
    let isCreating = $state(false);
    let users: User[] = $state([]);
    let addedUserIds: string[] = $state([]);

    // Load users on mount
    $effect.pre(() => {
        if (users.length === 0) {
            loadUsers();
        }
    });

    // Reset added users when room or edition changes, and populate from existing tables
    $effect(() => {
        tablePlanState.currentRoom;
        tablePlanState.currentEdition;

        // Populate addedUserIds from existing table names in the current room
        if (tablePlanState.currentRoom?.tables && users.length > 0) {
            const tableNames = tablePlanState.currentRoom.tables.map((t: any) => t.name);
            const usedUserIds = users.filter((u: User) => tableNames.includes(u.name)).map((u: User) => u.id);
            addedUserIds = usedUserIds;
        } else {
            addedUserIds = [];
        }
    });

    async function loadUsers() {
        try {
            const response = await fetch("/api/users");
            if (response.ok) {
                users = await response.json();
            }
        } catch (err) {
            console.error("Error loading users:", err);
        }
    }

    function handleUserSelect(user: User) {
        addedUserIds = [...addedUserIds, user.id];
    }

    async function handleAddTable() {
        if (!tableName.trim() || !tablePlanState.currentRoom) return;

        isCreating = true;
        try {
            const response = await fetch(
                `/api/admin/editions/${tablePlanState.currentEdition?.id}/rooms/${tablePlanState.currentRoom?.id}/tables`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: tableName,
                        capacity: 8,
                        width: 1,
                        height: 3,
                    }),
                },
            );

            if (response.ok) {
                const newTable = await response.json();
                // Add to current room's tables using store update
                tablePlanState.addTableToCurrentRoom(newTable);

                // Find the user by name and add their ID to the used list
                const selectedUser = users.find((u: User) => u.name === tableName);
                if (selectedUser && !addedUserIds.includes(selectedUser.id)) {
                    addedUserIds = [...addedUserIds, selectedUser.id];
                }

                tableName = "Table";
            }
        } catch (err) {
            console.error("Error adding table:", err);
        } finally {
            isCreating = false;
        }
    }
</script>

<div class="flex w-full flex-col gap-2" data-no-drag>
    <div class="flex items-end gap-2">
        <UserSearch bind:selectedName={tableName} {users} {addedUserIds} onUserSelect={handleUserSelect} />
        <Button onclick={handleAddTable} disabled={!tableName.trim() || isCreating} variant="default" size="sm">
            <Plus size={16} />
        </Button>
    </div>
</div>

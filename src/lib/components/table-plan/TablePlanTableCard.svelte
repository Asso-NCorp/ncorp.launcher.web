<script lang="ts">
    import { cn } from "$lib/utils";
    import type { TableWithSeats } from "$lib/states/table-plan.svelte";
    import { tablePlanState } from "$lib/states/table-plan.svelte";
    import { Card } from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";

    interface User {
        id: string;
        name: string;
        role: string;
        image?: string;
    }

    interface Props {
        table: TableWithSeats;
        isSelected?: boolean;
        users?: User[];
    }

    const { table, isSelected = false, users = [] } = $props();

    let isEditing = $state(false);
    let editingName = $state(table.name);
    let inputElement = $state<HTMLDivElement | undefined>(undefined);
    let clickCount = $state(0);
    let clickTimeout = $state<ReturnType<typeof setTimeout> | null>(null);
    let imageLoadError = $state(false);
    const DUAL_CLICK_DELAY = 800; // ms for dual-click (two separate clicks)

    function handleImageError() {
        imageLoadError = true;
    }

    function handleNameClick() {
        clickCount++;

        if (clickTimeout) {
            clearTimeout(clickTimeout);
        }

        // On second click, check if it's within the delay window
        if (clickCount === 2 && isSelected) {
            // Double-click or dual-click detected
            clickCount = 0;
            enterEditMode();
            return;
        }

        // Set timeout to reset click count if no second click happens
        clickTimeout = setTimeout(() => {
            clickCount = 0;
        }, DUAL_CLICK_DELAY);
    }

    function enterEditMode() {
        isEditing = true;
        editingName = table.name;
        // Focus input after DOM update
        setTimeout(() => {
            const input = inputElement?.querySelector("input") as HTMLInputElement | null;
            input?.focus();
            input?.select();
        }, 0);
    }

    async function handleNameChange() {
        if (!editingName.trim()) {
            editingName = table.name;
            isEditing = false;
            return;
        }

        if (editingName === table.name) {
            isEditing = false;
            return;
        }

        // Update locally first
        const oldName = table.name;
        table.name = editingName;
        isEditing = false;

        // Save to server
        try {
            const response = await fetch(
                `/api/admin/editions/${tablePlanState.currentEdition?.id}/rooms/${tablePlanState.currentRoom?.id}/tables/${table.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: editingName,
                    }),
                },
            );

            if (!response.ok) {
                console.error("Failed to update table name:", await response.text());
                table.name = oldName; // Revert on error
            }
        } catch (err) {
            console.error("Error updating table name:", err);
            table.name = oldName; // Revert on error
        }
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            handleNameChange();
        } else if (e.key === "Escape") {
            isEditing = false;
            editingName = table.name;
        }
    }

    function handleInputBlur() {
        handleNameChange();
    }

    let matchingUser = $derived.by(() => users.find((u: User) => u.name === table.name));
</script>

<Card
    class={cn(
        "flex h-full w-full flex-col items-center justify-center rounded-md p-2",
        "transition-all",
        isSelected && "ring-primary ring-2",
    )}>
    <div class="flex items-center justify-center gap-2">
        {#if matchingUser?.image && !imageLoadError}
            <img
                src={matchingUser.image}
                alt={matchingUser.name}
                class="size-6 shrink-0 rounded-full object-cover"
                onerror={handleImageError} />
        {/if}
        <div class="truncate">
            {#if isEditing}
                <div bind:this={inputElement}>
                    <Input
                        bind:value={editingName}
                        onkeydown={handleKeyDown}
                        onblur={handleInputBlur}
                        class="h-auto px-1 py-0 text-center text-xs"
                        placeholder="Table name" />
                </div>
            {:else}
                <h3
                    class="text-foreground cursor-pointer truncate text-center text-sm font-bold transition-opacity hover:opacity-75"
                    onclick={handleNameClick}
                    role="button"
                    tabindex="0"
                    onkeydown={(e) => {
                        if (e.key === "Enter" && isSelected) {
                            enterEditMode();
                        }
                    }}>
                    {table.name}
                </h3>
            {/if}
        </div>
    </div>
</Card>

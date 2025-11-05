<script lang="ts">
    import { fade } from "svelte/transition";
    import { Spring } from "svelte/motion";
    import { tablePlanState } from "$lib/states/table-plan.svelte";
    import type { TableWithSeats, RoomWithTables } from "$lib/states/table-plan.svelte";
    import { cn } from "$lib/utils";
    import { t } from "$lib/translations";
    import { Button } from "$lib/components/ui/button";
    import { RotateCw, Trash2, ZoomIn, ZoomOut } from "@lucide/svelte";
    import TablePlanTableCard from "./TablePlanTableCard.svelte";

    interface User {
        id: string;
        name: string;
        role: string;
        image?: string;
    }

    interface Props {
        room: RoomWithTables | null;
        mode?: "editor" | "viewer";
        onDeleteTable?: (tableId: string) => void | undefined;
        users?: User[];
        currentUserName?: string;
    }

    const { room, mode = "editor", onDeleteTable, users = [], currentUserName } = $props();

    let canvasElement: HTMLDivElement | undefined;
    let scrollContainer: HTMLDivElement | undefined;
    let draggedTable: TableWithSeats | null = $state(null);
    let dragOffset = $state({ x: 0, y: 0 });
    let hoveredTableId: string | null = $state(null);
    let resizingTable: TableWithSeats | null = $state(null);
    let resizeStartSize = $state({ width: 0, height: 0 });
    let resizeStartPos = $state({ x: 0, y: 0 });
    let displayTables = $state<TableWithSeats[]>([]);
    let zoom = $state(1);
    let canvasWidth = $state<number>(0);
    let canvasHeight = $state<number>(0);

    const gridSize = 50;

    // Calculate canvas dimensions based on table positions
    function calculateCanvasDimensions() {
        if (!room?.tables || room.tables.length === 0) {
            // Default minimum size: at least 800x600 pixels
            canvasWidth = 1600; // 800px / 0.5 zoom minimum
            canvasHeight = 1200; // 600px / 0.5 zoom minimum
            return;
        }

        let maxX = 0;
        let maxY = 0;

        for (const table of room.tables) {
            const tableRightEdge = (table.positionX + table.width) * gridSize;
            const tableBottomEdge = (table.positionY + table.height) * gridSize;
            maxX = Math.max(maxX, tableRightEdge);
            maxY = Math.max(maxY, tableBottomEdge);
        }

        // Add 20% padding and ensure minimum size
        canvasWidth = Math.max(1600, maxX * 1.2);
        canvasHeight = Math.max(1200, maxY * 1.2);
    }

    // Recalculate dimensions when room or tables change
    $effect(() => {
        if (room?.tables) {
            calculateCanvasDimensions();
        }
    });
    $effect(() => {
        if (room?.tables) {
            // Clear display tables to trigger animation
            displayTables = [];
            // Then add tables one by one with stagger
            room.tables.forEach((table: TableWithSeats, i: number) => {
                setTimeout(() => {
                    displayTables = [...displayTables, table];
                }, i * 20);
            });
        } else {
            displayTables = [];
        }
    });

    function snapToGrid(value: number): number {
        return Math.round(value / gridSize) * gridSize;
    }

    function checkCollision(
        positionX: number,
        positionY: number,
        width: number,
        height: number,
        excludeTableId?: string,
    ): boolean {
        if (!room?.tables) return false;

        for (const table of room.tables) {
            // Skip the table being checked (for moving tables)
            if (excludeTableId !== undefined && table.id === excludeTableId) {
                continue;
            }

            // Check if bounding boxes intersect
            const aLeft = positionX;
            const aRight = positionX + width;
            const aTop = positionY;
            const aBottom = positionY + height;

            const bLeft = table.positionX;
            const bRight = table.positionX + table.width;
            const bTop = table.positionY;
            const bBottom = table.positionY + table.height;

            // If boxes intersect at all, return true
            if (aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop) {
                return true;
            }
        }

        return false;
    }

    function handleMouseDown(e: MouseEvent, table: TableWithSeats) {
        if (mode === "viewer") return;
        if ((e.target as HTMLElement).closest("[data-no-drag]")) {
            return;
        }

        draggedTable = table;
        tablePlanState.setSelectedTable(table.id);
        tablePlanState.setDragging(true);

        const rect = canvasElement?.getBoundingClientRect();
        if (!rect) return;

        dragOffset = {
            x: e.clientX - rect.left - table.positionX * gridSize,
            y: e.clientY - rect.top - table.positionY * gridSize,
        };

        e.preventDefault();
    }

    function handleMouseMove(e: MouseEvent) {
        if (!draggedTable) return;

        const rect = canvasElement?.getBoundingClientRect();
        if (!rect) return;

        const x = snapToGrid(e.clientX - rect.left - dragOffset.x);
        const y = snapToGrid(e.clientY - rect.top - dragOffset.y);

        const newX = Math.max(0, x / gridSize);
        const newY = Math.max(0, y / gridSize);

        // Check collision against other tables (we pass the dragged table's ID to exclude it from check)
        // We need to temporarily check against the room's table list but exclude the current dragged table
        if (room?.tables) {
            let wouldCollide = false;
            for (const table of room.tables) {
                // Skip the table being dragged
                if (table.id === draggedTable.id) continue;

                // Check if new position would intersect with this table
                const aLeft = newX;
                const aRight = newX + draggedTable.width;
                const aTop = newY;
                const aBottom = newY + draggedTable.height;

                const bLeft = table.positionX;
                const bRight = table.positionX + table.width;
                const bTop = table.positionY;
                const bBottom = table.positionY + table.height;

                if (aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop) {
                    wouldCollide = true;
                    break;
                }
            }

            // Only update position if no collision
            if (!wouldCollide) {
                draggedTable.positionX = newX;
                draggedTable.positionY = newY;
            }
        }
    }

    function handleResizeStart(e: MouseEvent, table: TableWithSeats) {
        if (mode === "viewer") return;
        e.stopPropagation();
        resizingTable = table;
        resizeStartSize = { width: table.width, height: table.height };
        resizeStartPos = { x: e.clientX, y: e.clientY };
        tablePlanState.setSelectedTable(table.id);
        tablePlanState.setDragging(true);
    }

    function handleResizeMove(e: MouseEvent) {
        if (!resizingTable) return;

        const rect = canvasElement?.getBoundingClientRect();
        if (!rect) return;

        const deltaX = e.clientX - resizeStartPos.x;
        const deltaY = e.clientY - resizeStartPos.y;

        // Convert pixel movement to grid units
        const gridDeltaX = Math.round(deltaX / gridSize);
        const gridDeltaY = Math.round(deltaY / gridSize);

        // Calculate new dimensions (minimum 1x1)
        const newWidth = Math.max(1, resizeStartSize.width + gridDeltaX);
        const newHeight = Math.max(1, resizeStartSize.height + gridDeltaY);

        // Check if resize would cause collision
        let wouldCollide = false;
        if (room?.tables) {
            for (const table of room.tables) {
                if (table.id === resizingTable.id) continue;

                const aLeft = resizingTable.positionX;
                const aRight = resizingTable.positionX + newWidth;
                const aTop = resizingTable.positionY;
                const aBottom = resizingTable.positionY + newHeight;

                const bLeft = table.positionX;
                const bRight = table.positionX + table.width;
                const bTop = table.positionY;
                const bBottom = table.positionY + table.height;

                if (aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop) {
                    wouldCollide = true;
                    break;
                }
            }
        }

        if (!wouldCollide) {
            resizingTable.width = newWidth;
            resizingTable.height = newHeight;
        }
    }

    async function handleResizeEnd() {
        if (!resizingTable) return;

        tablePlanState.setDragging(false);

        const editionId = tablePlanState.currentEdition?.id;
        const roomId = room?.id;

        if (!editionId || !roomId) {
            console.error("Missing editionId or roomId for table update");
            resizingTable = null;
            return;
        }

        try {
            const response = await fetch(
                `/api/admin/editions/${editionId}/rooms/${roomId}/tables/${resizingTable.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        width: resizingTable.width,
                        height: resizingTable.height,
                    }),
                },
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Failed to resize table:", response.status, errorText);

                // If 401 or redirected to signin, redirect to login
                if (response.status === 401 || response.redirected) {
                    window.location.href = "/signin";
                    return;
                }
            }
        } catch (err) {
            console.error("Error resizing table:", err);
        } finally {
            resizingTable = null;
            calculateCanvasDimensions();
        }
    }

    async function handleMouseUp() {
        if (resizingTable) {
            await handleResizeEnd();
            return;
        }

        if (!draggedTable) return;

        tablePlanState.setDragging(false);

        // Save position to server
        const editionId = tablePlanState.currentEdition?.id;
        const roomId = room?.id;

        if (!editionId || !roomId) {
            console.error("Missing editionId or roomId for table update");
            draggedTable = null;
            return;
        }

        try {
            const response = await fetch(`/api/admin/editions/${editionId}/rooms/${roomId}/tables/${draggedTable.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    positionX: draggedTable.positionX,
                    positionY: draggedTable.positionY,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Failed to update table position:", response.status, errorText);

                // If 401 or redirected to signin, redirect to login
                if (response.status === 401 || response.redirected) {
                    window.location.href = "/signin";
                    return;
                }
            }
        } catch (err) {
            console.error("Error updating table position:", err);
        } finally {
            draggedTable = null;
            calculateCanvasDimensions();
        }
    }

    function handleCanvasClick(e: MouseEvent) {
        if (e.target === canvasElement) {
            tablePlanState.setSelectedTable(null);
        }
    }

    async function handleRotateTable(table: TableWithSeats) {
        // Swap width and height for rotation
        const newWidth = table.height;
        const newHeight = table.width;

        // Check if rotation would cause collision
        if (checkCollision(table.positionX, table.positionY, newWidth, newHeight, table.id)) {
            return; // Can't rotate, would collide with another table
        }

        table.width = newWidth;
        table.height = newHeight;

        // Save to server
        const editionId = tablePlanState.currentEdition?.id;
        const roomId = room?.id;

        if (!editionId || !roomId) {
            console.error("Missing editionId or roomId for table rotation");
            return;
        }

        try {
            const response = await fetch(`/api/admin/editions/${editionId}/rooms/${roomId}/tables/${table.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    width: newWidth,
                    height: newHeight,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Failed to rotate table:", response.status, errorText);

                // If 401 or redirected to signin, redirect to login
                if (response.status === 401 || response.redirected) {
                    window.location.href = "/signin";
                    return;
                }
            }
        } catch (err) {
            console.error("Error rotating table:", err);
        }
    }

    function handleZoomIn() {
        zoom = Math.min(zoom + 0.2, 3);
        updateCanvasZoom();
    }

    function handleZoomOut() {
        zoom = Math.max(zoom - 0.2, 0.5);
        updateCanvasZoom();
    }

    function handleResetZoom() {
        zoom = 1;
        updateCanvasZoom();
    }

    function updateCanvasZoom() {
        if (canvasElement) {
            canvasElement.style.transform = `scale(${zoom})`;
            canvasElement.style.transformOrigin = "top left";
        }
        // Reset scroll position when back to 100% zoom
        if (zoom === 1 && scrollContainer) {
            scrollContainer.scrollLeft = 0;
            scrollContainer.scrollTop = 0;
        }
    }
</script>

<svelte:window
    onmousemove={(e) => {
        handleMouseMove(e);
        handleResizeMove(e);
    }}
    onmouseup={handleMouseUp}
    onmouseleave={handleMouseUp} />

<!-- Zoom controls for editor mode -->
{#if mode === "editor"}
    <div class="absolute right-4 bottom-4 z-30 flex flex-col gap-2">
        <Button
            size="sm"
            variant="outline"
            class="h-8 w-8 p-0"
            onclick={handleZoomIn}
            title="Zoom in">
            <ZoomIn size={16} />
        </Button>
        <Button
            size="sm"
            variant="outline"
            class="h-8 w-8 p-0"
            onclick={handleZoomOut}
            title="Zoom out">
            <ZoomOut size={16} />
        </Button>
        <Button
            size="sm"
            variant="outline"
            class="h-8 w-8 p-0"
            onclick={handleResetZoom}
            title="Reset zoom">
            <span class="text-xs font-bold">{Math.round(zoom * 100)}%</span>
        </Button>
    </div>
{/if}

<!-- Scroll container for pan -->
<div bind:this={scrollContainer} class="relative h-full w-full overflow-auto">
    <div
        bind:this={canvasElement}
        onclick={handleCanvasClick}
        role="region"
        aria-label="Table plan canvas"
        class={cn(
            "bg-background relative",
            "border-border rounded-lg",
            tablePlanState.isDragging && "cursor-grabbing",
            mode === "editor" ? "" : "border-2 overflow-auto",
        )}
        style={`
            width: ${canvasWidth}px;
            height: ${canvasHeight}px;
            background-image: ${
                mode === "viewer"
                    ? `radial-gradient(circle, var(--border) 1px, transparent 1px)`
                    : `linear-gradient(0deg, transparent calc(100% - 1px), var(--border) calc(100% - 1px)),
                linear-gradient(90deg, transparent calc(100% - 1px), var(--border) calc(100% - 1px))`
            };
            background-size: ${mode === "viewer" ? `${gridSize}px ${gridSize}px` : `${gridSize}px ${gridSize}px`};
            background-position: ${mode === "viewer" ? `0 0` : `0 0`};
            background-color: var(--background);
        `}>
    {#if !room}
        <div class="absolute inset-0 flex items-center justify-center">
            <p class="text-muted-foreground/40 text-lg font-medium">
                {t.get("no_room_selected")}
            </p>
        </div>
    {/if}
    {#each displayTables as table, i (table.id)}
        <div
            transition:fade={{ duration: 150, delay: i * 20 }}
            onmousedown={(e) => handleMouseDown(e, table)}
            onmouseenter={() => (hoveredTableId = table.id)}
            onmouseleave={() => (hoveredTableId = null)}
            role="button"
            tabindex="0"
            class={cn(
                "absolute transition-shadow duration-200 select-none",
                mode === "editor" && tablePlanState.selectedTableId === table.id
                    ? "ring-primary z-20 shadow-lg ring-2"
                    : mode === "viewer" && currentUserName === table.name
                    ? "ring-primary z-20 shadow-lg ring-2"
                    : "z-10 shadow-md hover:shadow-lg",
                mode === "editor" && tablePlanState.isDragging ? "cursor-grabbing" : "cursor-pointer",
            )}
            style={`left: ${table.positionX * gridSize}px; top: ${table.positionY * gridSize}px; width: ${table.width * gridSize}px; height: ${table.height * gridSize}px;`}>
            <TablePlanTableCard
                {table}
                {users}
                isSelected={mode === "editor" && tablePlanState.selectedTableId === table.id} />

            <!-- Resize handle (bottom-right corner) -->
            {#if mode === "editor" && tablePlanState.selectedTableId === table.id}
                <div
                    onmousedown={(e) => handleResizeStart(e, table)}
                    class="bg-primary absolute right-0 bottom-0 h-3 w-3 cursor-se-resize"
                    style="cursor: nwse-resize; margin: -2px;"
                    title="Drag to resize table" />
            {/if}
        </div>

        <!-- Floating rotation and delete buttons (positioned relative to canvas) -->
        {#if mode === "editor" && tablePlanState.selectedTableId === table.id}
            <div
                class="pointer-events-none absolute flex gap-1"
                style={`left: ${(table.positionX + table.width) * gridSize + 4}px; top: ${table.positionY * gridSize + 4}px;`}
                data-no-drag>
                <Button
                    size="sm"
                    variant="outline"
                    class="pointer-events-auto h-6 w-6 p-0"
                    onclick={() => handleRotateTable(table)}
                    title="Rotate table">
                    <RotateCw size={14} />
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    class="text-destructive hover:text-destructive pointer-events-auto h-6 w-6 p-0"
                    onclick={() => {
                        if (onDeleteTable) {
                            onDeleteTable(table.id);
                        }
                    }}
                    title="Delete table">
                    <Trash2 size={14} />
                </Button>
            </div>
        {/if}
    {/each}
    </div>
</div>

<style>
    :global(body) {
        user-select: none;
    }
</style>

<script lang="ts">
    import { t } from "$lib/translations";
    import { Button } from "$lib/components/ui/button";
    import type { PageData } from "./$types";
    import TablePlanCanvas from "$lib/components/table-plan/TablePlanCanvas.svelte";
    import { ZoomIn, ZoomOut } from "@lucide/svelte";
    import { onMount } from "svelte";

    interface Props {
        data: PageData;
    }

    const { data } = $props();

    let selectedEditionId = $state<string | null>(data.editions[0]?.id ?? null);
    let selectedEdition = $derived(
        data.editions.find((e: (typeof data.editions)[number]) => e.id === selectedEditionId),
    );
    let selectedRoomId = $state<string | null>(selectedEdition?.rooms[0]?.id ?? null);
    let selectedRoom = $derived(
        selectedEdition?.rooms.find((r: (typeof selectedEdition.rooms)[number]) => r.id === selectedRoomId),
    );

    let zoom = $state(1);
    let canvasElement: HTMLDivElement | undefined = $state();
    let scrollContainer: HTMLDivElement | undefined = $state();
    let users = $state<any[]>([]);

    onMount(async () => {
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

    function getRelativeTime(date: Date | string): string {
        const targetDate = typeof date === "string" ? new Date(date) : date;
        const now = new Date();
        const diffMs = targetDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return `il y a ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? "s" : ""}`;
        } else if (diffDays === 0) {
            return "Aujourd'hui";
        } else if (diffDays === 1) {
            return "Demain";
        } else {
            return `Dans ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
        }
    }

    // Update room selection when edition changes
    $effect(() => {
        if (selectedEdition && selectedEdition.rooms.length > 0) {
            selectedRoomId = selectedEdition.rooms[0].id;
        } else {
            selectedRoomId = null;
        }
    });

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

<div class="bg-background flex h-screen w-screen flex-col gap-0 p-0">
    <div class="border-border flex items-center justify-between border-b px-6 py-4">
        <div>
            <h1 class="text-foreground text-3xl font-bold">{t.get("table_plan_manager")}</h1>
            <p class="text-muted-foreground">
                {#if selectedEdition}
                    {t.get("edition")}: {selectedEdition.name}
                {:else}
                    {t.get("no_edition_selected")}
                {/if}
            </p>
        </div>
    </div>

    <!-- Edition selector -->
    {#if data.editions.length > 0}
        <div class="border-border flex gap-2 overflow-x-auto border-b px-6 py-2">
            {#each data.editions as edition (edition.id)}
                <Button
                    onclick={() => (selectedEditionId = edition.id)}
                    variant={selectedEditionId === edition.id ? "default" : "outline"}
                    class="whitespace-nowrap">
                    {edition.name}
                </Button>
            {/each}
        </div>
    {/if}

    {#if data.editions.length === 0}
        <div class="flex flex-1 flex-col items-center justify-center gap-6">
            <div class="text-center">
                <h2 class="text-foreground mb-2 text-2xl font-semibold">{t.get("no_edition_selected")}</h2>
                <p class="text-muted-foreground mb-6">{t.get("create_your_first_edition")}</p>
            </div>
        </div>
    {:else if selectedEdition}
        <div class="flex h-0 flex-1 gap-0 overflow-hidden">
            <!-- Sidebar -->
            <div class="border-border flex w-64 flex-col gap-0 overflow-hidden border-r">
                <!-- Rooms -->
                <div class="border-border bg-card flex-1 overflow-y-auto border-b p-4">
                    <div class="mb-3">
                        <h2 class="text-card-foreground font-semibold">{t.get("rooms")}</h2>
                    </div>
                    <div class="space-y-2">
                        {#each selectedEdition.rooms as room (room.id)}
                            <div class="group flex items-center gap-1">
                                <button
                                    onclick={() => (selectedRoomId = room.id)}
                                    class="flex-1 rounded-md border px-3 py-2 text-left transition-colors
                                        {selectedRoomId === room.id
                                        ? 'bg-primary/20 border-primary text-card-foreground'
                                        : 'text-card-foreground border-transparent bg-transparent'} ">
                                    <p class="font-medium">{room.name}</p>
                                    <p class="text-muted-foreground text-xs">
                                        {room.tables.length}
                                        {t.get("tables")}
                                    </p>
                                </button>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>

            <!-- Canvas -->
            <div class="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden">
                <!-- Edition Header Card -->
                {#if selectedEdition && selectedRoom}
                    <div class="border-border bg-card border-b px-6 py-3 text-center">
                        <h2 class="text-2xl font-bold">{selectedEdition.name}</h2>
                        {#if selectedEdition}
                            <p class="text-muted-foreground mt-1 text-sm">
                                {new Date(selectedEdition.startDate).toLocaleDateString()} - {new Date(
                                    selectedEdition.endDate,
                                ).toLocaleDateString()}
                            </p>
                            <p class="text-foreground mt-1 text-xs font-medium">
                                {getRelativeTime(selectedEdition.endDate)}
                            </p>
                        {/if}
                        <p class="text-muted-foreground mt-2 text-xs">
                            <span class="font-medium">Salle :</span>
                            {selectedRoom.name}
                        </p>
                    </div>
                {/if}
                <div class="border-border relative min-h-0 flex-1 overflow-hidden">
                    {#if selectedRoom}
                        <!-- Zoom Controls -->
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
                        <div bind:this={scrollContainer} class="h-full w-full overflow-auto">
                            <div bind:this={canvasElement} class="relative h-full w-full origin-top-left">
                                <TablePlanCanvas
                                    room={selectedRoom}
                                    mode="viewer"
                                    onDeleteTable={() => {}}
                                    {users}
                                    currentUserName={undefined} />
                            </div>
                        </div>
                    {:else}
                        <div class="flex h-full items-center justify-center">
                            <p class="text-muted-foreground/40 text-lg font-medium">
                                {t.get("no_room_selected")}
                            </p>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>

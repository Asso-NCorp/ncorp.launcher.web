<script lang="ts">
    import { t } from "$lib/translations";
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import type { PageData } from "./$types";
    import TablePlanCanvas from "$lib/components/table-plan/TablePlanCanvas.svelte";
    import { ZoomIn, ZoomOut, Move } from "@lucide/svelte";
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

<div class="bg-background flex h-full flex-col gap-4 p-6">
    <div class="flex items-center justify-between">
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
        <div class="flex gap-2 overflow-x-auto pb-2">
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
        <div class="flex h-[calc(100%-200px)] gap-4">
            <!-- Sidebar -->
            <div class="flex w-64 flex-col gap-4 overflow-hidden">
                <!-- Rooms -->
                <div class="border-border bg-card flex-1 overflow-y-auto rounded-lg border p-4">
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
            <div class="flex min-h-0 flex-1 flex-col gap-4">
                <div class="border-border relative min-h-0 flex-1 rounded-lg border">
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
                                <!-- Pixel Grid Overlay -->
                                <div
                                    class="pointer-events-none absolute top-0 right-0 left-0 z-10 mask-[linear-gradient(to_bottom,rgba(255,255,255,1)_0%,rgba(255,255,255,0.5)_60%,rgba(255,255,255,0)_100%)] opacity-15"
                                    style={`height: 200px; background-image: url('data:image/svg+xml,<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" fill="none"/><rect width="20" height="20" fill="hsl(270 85%25 65%25)"/><rect x="20" y="20" width="20" height="20" fill="hsl(270 85%25 65%25)"/></svg>'); background-size: 40px 40px;`} />
                                <!-- Edition Info Overlay -->
                                <div
                                    class="pointer-events-none absolute top-0 right-0 left-0 z-20 bg-linear-to-b from-black/20 to-transparent p-6 text-center">
                                    <h2 class="text-3xl font-bold text-white drop-shadow-lg">
                                        {selectedEdition?.name}
                                    </h2>
                                    {#if selectedEdition}
                                        <p class="mt-2 text-lg text-white/80 drop-shadow-md">
                                            {new Date(selectedEdition.createdAt).toLocaleDateString()} - {new Date(
                                                selectedEdition.updatedAt,
                                            ).toLocaleDateString()}
                                        </p>
                                    {/if}
                                    <p class="mt-3 text-sm text-white/70 drop-shadow-md">
                                        {selectedRoom?.name}
                                    </p>
                                </div>
                                <TablePlanCanvas room={selectedRoom} mode="viewer" onDeleteTable={() => {}} {users} />
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
                <p class="text-muted-foreground text-sm">
                    {t.get("rooms")}: {selectedRoom?.name || t.get("no_room_selected")}
                </p>
            </div>
        </div>
    {/if}
</div>

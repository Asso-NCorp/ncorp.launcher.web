<script lang="ts">
    import BlurFade from "$src/lib/components/custom/BlurFade.svelte";
    import type { PageData } from "./$types";
    import AddEventForm from "./add-event-form.svelte";
    import EditEventForm from "./edit-event-form.svelte";
    import { onMount } from "svelte";
    import type { event } from "$src/generated/prisma/client";
    import * as Card from "$lib/components/ui/card";
    import { Calendar, Trash2 } from "@lucide/svelte";
    import { Button } from "$lib/components/ui/button";
    import dayjs from "dayjs";
    import { invalidateAll } from "$app/navigation";
    import { toast } from "svelte-sonner";

    let { data }: { data: PageData } = $props();
    let selectedEvent: event | null = $state(null);
    let showAddForm = $state(false);

    const formatDate = (d: Date | null) => (d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "—");

    const isUpcoming = (e: event) => new Date(e.start_time) > new Date();
    const isOngoing = (e: event) => {
        const now = new Date();
        return new Date(e.start_time) <= now && (!e.end_time || new Date(e.end_time) > now);
    };

    async function handleDelete(ev: event) {
        if (!confirm(`Supprimer l'événement "${ev.name}" ?`)) return;

        const formData = new FormData();
        formData.append("id", ev.id);

        const response = await fetch("?/delete", {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            toast.success("Événement supprimé");
            if (selectedEvent?.id === ev.id) {
                selectedEvent = null;
            }
            await invalidateAll();
        } else {
            toast.error("Erreur lors de la suppression");
        }
    }

    const handleSelectEvent = (ev: event) => {
        selectedEvent = ev;
        showAddForm = false;
    };

    const handleShowAddForm = () => {
        showAddForm = true;
        selectedEvent = null;
    };

    onMount(() => {
        const handleClearSelection = () => {
            selectedEvent = null;
            showAddForm = true;
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
            <div class="from-primary/20 to-primary/10 rounded-lg bg-linear-to-br p-2">
                <Calendar class="text-primary size-6" />
            </div>
            <BlurFade delay={0.2} class="text-3xl font-bold">Gestion des événements</BlurFade>
        </div>
        <p class="text-muted-foreground text-sm">Gérez les événements de la plateforme</p>
    </div>

    <!-- Stats Section -->
    <div class="grid grid-cols-3 gap-4">
        <Card.Root>
            <Card.Content class="pt-6">
                <div class="space-y-2">
                    <p class="text-muted-foreground text-sm font-medium">Total</p>
                    <p class="text-2xl font-bold">{data.events.length}</p>
                </div>
            </Card.Content>
        </Card.Root>
        <Card.Root>
            <Card.Content class="pt-6">
                <div class="space-y-2">
                    <p class="text-muted-foreground text-sm font-medium">En cours</p>
                    <p class="text-2xl font-bold">{data.events.filter(isOngoing).length}</p>
                </div>
            </Card.Content>
        </Card.Root>
        <Card.Root>
            <Card.Content class="pt-6">
                <div class="space-y-2">
                    <p class="text-muted-foreground text-sm font-medium">À venir</p>
                    <p class="text-2xl font-bold">{data.events.filter(isUpcoming).length}</p>
                </div>
            </Card.Content>
        </Card.Root>
    </div>

    <!-- Main Content -->
    <div class="grid flex-1 grid-cols-3 gap-6">
        <!-- Events List -->
        <div class="col-span-2 min-h-0">
            <Card.Root class="flex h-full flex-col">
                <Card.Header class="border-b">
                    <div class="flex items-center justify-between">
                        <Card.Title>Liste des événements</Card.Title>
                        <button
                            onclick={handleShowAddForm}
                            class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-2 py-1.5 text-xs font-medium transition-colors">
                            + Ajouter
                        </button>
                    </div>
                </Card.Header>
                <Card.Content class="flex-1 overflow-auto p-0">
                    {#if data.events.length === 0}
                        <div class="flex flex-col items-center justify-center py-12 text-center">
                            <Calendar class="text-muted-foreground mb-3 size-10" />
                            <p class="text-muted-foreground">Aucun événement</p>
                        </div>
                    {:else}
                        <div class="divide-y">
                            {#each data.events as ev (ev.id)}
                                {@const ongoing = isOngoing(ev)}
                                {@const upcoming = isUpcoming(ev)}
                                <button
                                    class="hover:bg-muted/50 flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors {selectedEvent?.id ===
                                    ev.id
                                        ? 'bg-muted'
                                        : ''}"
                                    onclick={() => handleSelectEvent(ev)}>
                                    <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <div class="flex items-center gap-2">
                                            <span class="truncate font-medium">{ev.name}</span>
                                            {#if ongoing}
                                                <span
                                                    class="shrink-0 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
                                                    En cours
                                                </span>
                                            {:else if upcoming}
                                                <span
                                                    class="shrink-0 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                                                    À venir
                                                </span>
                                            {:else}
                                                <span
                                                    class="bg-muted text-muted-foreground shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium">
                                                    Terminé
                                                </span>
                                            {/if}
                                        </div>
                                        <span class="text-muted-foreground text-xs">
                                            {formatDate(ev.start_time)}{ev.end_time
                                                ? ` → ${formatDate(ev.end_time)}`
                                                : ""}
                                        </span>
                                        {#if ev.description}
                                            <span class="text-muted-foreground truncate text-xs">{ev.description}</span>
                                        {/if}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        class="text-destructive hover:text-destructive shrink-0"
                                        onclick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(ev);
                                        }}>
                                        <Trash2 class="size-4" />
                                    </Button>
                                </button>
                            {/each}
                        </div>
                    {/if}
                </Card.Content>
            </Card.Root>
        </div>

        <!-- Side Panel -->
        <div class="col-span-1 min-h-0">
            {#if showAddForm}
                <AddEventForm data={{ addForm: data.addForm }} />
            {:else if selectedEvent}
                <EditEventForm data={{ editForm: data.editForm }} event={selectedEvent} />
            {:else}
                <Card.Root class="sticky top-4 flex h-fit flex-col items-center justify-center px-4 py-12 text-center">
                    <div class="bg-muted mb-4 rounded-full p-3">
                        <Calendar class="text-muted-foreground size-6" />
                    </div>
                    <h3 class="text-lg font-semibold">Sélectionnez un événement</h3>
                    <p class="text-muted-foreground mt-2 text-sm">
                        Cliquez sur un événement dans la liste pour le modifier ou créez un nouvel événement
                    </p>
                </Card.Root>
            {/if}
        </div>
    </div>
</main>

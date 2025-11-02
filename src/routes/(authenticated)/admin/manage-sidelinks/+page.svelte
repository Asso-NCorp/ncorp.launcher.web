<script lang="ts">
    import BlurFade from "$src/lib/components/custom/BlurFade.svelte";
    import type { PageData } from "./$types";
    import SidelinkList from "$src/lib/components/custom/admin/SidelinkList.svelte";
    import AddSidelinkForm from "./add-sidelink-form.svelte";
    import EditSidelinkForm from "./edit-sidelink-form.svelte";
    import { onMount } from "svelte";
    import type { sidelink } from "@prisma/client";
    import { liveServerConnection } from "$src/lib/states/live-server.svelte";
    import { global } from "$src/lib/states/global.svelte";
    import * as Card from "$lib/components/ui/card";
    import { Link } from "@lucide/svelte";

    let { data }: { data: PageData } = $props();
    let selectedSidelink: sidelink | null = $state(null);
    let showAddForm = $state(false);

    // Handle delete action
    async function handleDelete(sidelink: sidelink) {
        const formData = new FormData();
        formData.append("id", sidelink.id.toString());

        const response = await fetch("?/delete", {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            await liveServerConnection.broadcastMessage("SideLinksUpdated");
        } else {
            console.error("Failed to delete sidelink");
        }
    }

    const handleSelectSidelink = (sidelink: sidelink) => {
        selectedSidelink = sidelink;
        showAddForm = false;
    };

    const handleShowAddForm = () => {
        showAddForm = true;
        selectedSidelink = null;
    };

    // Listen for clearSelection event
    onMount(() => {
        const handleClearSelection = () => {
            selectedSidelink = null;
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
            <div class="rounded-lg bg-linear-to-br from-primary/20 to-primary/10 p-2">
                <Link class="size-6 text-primary" />
            </div>
            <BlurFade delay={0.2} class="text-3xl font-bold">Gestion des liens</BlurFade>
        </div>
        <p class="text-sm text-muted-foreground">Gérez les liens de la sidebar</p>
    </div>

    <!-- Stats Section -->
    <div class="grid grid-cols-2 gap-4">
        <Card.Root>
            <Card.Content class="pt-6">
                <div class="space-y-2">
                    <p class="text-sm font-medium text-muted-foreground">Liens actifs</p>
                    <p class="text-2xl font-bold">{global.sideLinks.filter(l => !l.hidden).length}</p>
                </div>
            </Card.Content>
        </Card.Root>
        <Card.Root>
            <Card.Content class="pt-6">
                <div class="space-y-2">
                    <p class="text-sm font-medium text-muted-foreground">Liens masqués</p>
                    <p class="text-2xl font-bold">{global.sideLinks.filter(l => l.hidden).length}</p>
                </div>
            </Card.Content>
        </Card.Root>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-3 gap-6 flex-1">
        <!-- Sidelinks List -->
        <div class="col-span-2 min-h-0">
            <Card.Root class="h-full flex flex-col">
                <Card.Header class="border-b">
                    <div class="flex items-center justify-between">
                        <Card.Title>Liste des liens</Card.Title>
                        <button
                            on:click={handleShowAddForm}
                            class="inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            +
                        </button>
                    </div>
                </Card.Header>
                <Card.Content class="flex-1 overflow-auto p-0">
                    <SidelinkList
                        sidelinks={global.sideLinks}
                        loading={false}
                        onSelect={handleSelectSidelink}
                        onDelete={handleDelete} />
                </Card.Content>
            </Card.Root>
        </div>

        <!-- Side Panel -->
        <div class="col-span-1 min-h-0">
            {#if showAddForm}
                <AddSidelinkForm data={{ addForm: data.addForm }} />
            {:else if selectedSidelink}
                <EditSidelinkForm data={{ editForm: data.editForm }} sidelink={selectedSidelink} />
            {:else}
                <Card.Root class="sticky top-4 flex h-fit flex-col items-center justify-center py-12 px-4 text-center">
                    <div class="rounded-full bg-muted p-3 mb-4">
                        <Link class="size-6 text-muted-foreground" />
                    </div>
                    <h3 class="text-lg font-semibold">Sélectionnez un lien</h3>
                    <p class="mt-2 text-sm text-muted-foreground">
                        Cliquez sur un lien dans la liste pour le modifier ou créez un nouveau lien
                    </p>
                </Card.Root>
            {/if}
        </div>
    </div>
</main>

<script lang="ts">
    import BlurFade from "$src/lib/components/custom/BlurFade.svelte";
    import type { PageData } from "./$types";
    import GameServerList from "$src/lib/components/custom/admin/GameServerList.svelte";
    import AddGameServerForm from "./add-game-server-form.svelte";
    import EditGameServerForm from "./edit-game-server-form.svelte";
    import { onMount } from "svelte";
    import type { game_server } from "@prisma/client";
    import * as Card from "$lib/components/ui/card";
    import { Server } from "@lucide/svelte";
    import { invalidateAll } from "$app/navigation";

    let { data }: { data: PageData } = $props();
    let selectedGameServer: game_server | null = $state(null);
    let showAddForm = $state(false);

    // Handle delete action
    async function handleDelete(gameServer: game_server) {
        const formData = new FormData();
        formData.append("id", gameServer.id.toString());

        const response = await fetch("?/delete", {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            await invalidateAll();
        } else {
            console.error("Failed to delete game server");
        }
    }

    const handleSelectGameServer = (gameServer: game_server) => {
        selectedGameServer = gameServer;
        showAddForm = false;
    };

    const handleShowAddForm = () => {
        showAddForm = true;
        selectedGameServer = null;
    };

    // Listen for clearSelection event
    onMount(() => {
        const handleClearSelection = () => {
            selectedGameServer = null;
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
                <Server class="text-primary size-6" />
            </div>
            <BlurFade delay={0.2} class="text-3xl font-bold">Gestion des serveurs de jeu</BlurFade>
        </div>
        <p class="text-muted-foreground text-sm">Gérez les serveurs de jeu et leur monitoring</p>
    </div>

    <!-- Stats Section -->
    <div class="grid grid-cols-3 gap-4">
        <Card.Root>
            <Card.Content class="pt-6">
                <div class="space-y-2">
                    <p class="text-muted-foreground text-sm font-medium">Serveurs totaux</p>
                    <p class="text-2xl font-bold">{data.gameServers.length}</p>
                </div>
            </Card.Content>
        </Card.Root>
        <Card.Root>
            <Card.Content class="pt-6">
                <div class="space-y-2">
                    <p class="text-muted-foreground text-sm font-medium">Serveurs monitorés</p>
                    <p class="text-2xl font-bold">{data.gameServers.filter((s) => s.monitor).length}</p>
                </div>
            </Card.Content>
        </Card.Root>
        <Card.Root>
            <Card.Content class="pt-6">
                <div class="space-y-2">
                    <p class="text-muted-foreground text-sm font-medium">Serveurs TCP</p>
                    <p class="text-2xl font-bold">{data.gameServers.filter((s) => s.type === "tcp").length}</p>
                </div>
            </Card.Content>
        </Card.Root>
    </div>

    <!-- Main Content -->
    <div class="grid flex-1 grid-cols-3 gap-6">
        <!-- Game Servers List -->
        <div class="col-span-2 min-h-0">
            <Card.Root class="flex h-full flex-col">
                <Card.Header class="border-b">
                    <div class="flex items-center justify-between">
                        <Card.Title>Liste des serveurs</Card.Title>
                        <button
                            on:click={handleShowAddForm}
                            class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-2 py-1.5 text-xs font-medium transition-colors">
                            +
                        </button>
                    </div>
                </Card.Header>
                <Card.Content class="flex-1 overflow-auto p-0">
                    <GameServerList
                        gameServers={data.gameServers}
                        loading={false}
                        onSelect={handleSelectGameServer}
                        onDelete={handleDelete} />
                </Card.Content>
            </Card.Root>
        </div>

        <!-- Side Panel -->
        <div class="col-span-1 min-h-0">
            {#if showAddForm}
                <AddGameServerForm data={{ addForm: data.addForm, games: data.games }} />
            {:else if selectedGameServer}
                <EditGameServerForm
                    data={{ editForm: data.editForm, games: data.games }}
                    gameServer={selectedGameServer} />
            {:else}
                <Card.Root class="sticky top-4 flex h-fit flex-col items-center justify-center px-4 py-12 text-center">
                    <div class="bg-muted mb-4 rounded-full p-3">
                        <Server class="text-muted-foreground size-6" />
                    </div>
                    <h3 class="text-lg font-semibold">Sélectionnez un serveur</h3>
                    <p class="text-muted-foreground mt-2 text-sm">
                        Cliquez sur un serveur dans la liste pour le modifier ou créez un nouveau serveur
                    </p>
                </Card.Root>
            {/if}
        </div>
    </div>
</main>

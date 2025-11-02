<script lang="ts">
    import { GamesStore } from "$src/lib/states/games.svelte";
    import type { InstallableGameExtended } from "$src/lib/types";
    import { onMount } from "svelte";
    import Input from "$lib/components/ui/input/input.svelte";
    import Button from "$lib/components/ui/button/button.svelte";
    import { getServerApi } from "$src/lib/utils";
    import { toast } from "svelte-sonner";
    import BlurFade from "$src/lib/components/custom/BlurFade.svelte";
    import * as Card from "$lib/components/ui/card";
    import { Star, Loader } from "@lucide/svelte";

    // --- STATE (doit être $state pour déclencher rerender en Svelte 5) ---
    let allGames = $state<InstallableGameExtended[]>([]);
    let originalFeaturedIds = $state<string[]>([]);
    let loading = $state(true);
    let saving = $state(false);
    let message = $state("");
    let error = $state("");

    let draggingId = $state<string | null>(null);
    let dragFrom = $state<"available" | "featured" | null>(null);

    let availableSearch = $state("");
    let featuredSearch = $state("");

    let addedFolderSlugs = $state<string[]>([]);
    let removedFolderSlugs = $state<string[]>([]);

    // --- Helpers ---
    function matchTitle(g: InstallableGameExtended, q: string) {
        if (!q) return true;
        return g.title.toLowerCase().includes(q.toLowerCase().trim());
    }

    // --- DERIVED ---
    const availableGames = $derived(allGames.filter((g) => !g.isFeatured));
    const featuredGames = $derived(allGames.filter((g) => g.isFeatured));

    const availableGamesFiltered = $derived(availableGames.filter((g) => matchTitle(g, availableSearch)));
    const featuredGamesFiltered = $derived(featuredGames.filter((g) => matchTitle(g, featuredSearch)));

    const addedGames = $derived(featuredGames.filter((g) => !originalFeaturedIds.includes(g.folderSlug)));
    const removedGames = $derived(availableGames.filter((g) => originalFeaturedIds.includes(g.folderSlug)));

    const isAdded = (g: InstallableGameExtended) => g.isFeatured && !originalFeaturedIds.includes(g.folderSlug);
    const isRemoved = (g: InstallableGameExtended) => !g.isFeatured && originalFeaturedIds.includes(g.folderSlug);

    const isDirty = $derived(
        JSON.stringify(featuredGames.map((g) => g.folderSlug)) !== JSON.stringify(originalFeaturedIds),
    );

    // --- INIT ---
    onMount(async () => {
        // Si GamesStore.games est un tableau direct
        if (Array.isArray((GamesStore as any).games)) {
            allGames = [...(GamesStore as any).games];
            if (allGames.length === 0) {
                loading = true;
                try {
                    await GamesStore.getAvailableGames();
                } catch (error) {
                    console.error("Erreur lors du chargement des jeux disponibles :", error);
                    loading = false;
                }
            }
        }
        // Si c’est un store Svelte (subscribe disponible)
        if (typeof (GamesStore as any).subscribe === "function") {
            (GamesStore as any).subscribe((val: InstallableGameExtended[] | { games: InstallableGameExtended[] }) => {
                if (Array.isArray(val)) {
                    allGames = [...val];
                } else if (val && Array.isArray((val as any).games)) {
                    allGames = [...(val as any).games];
                }
            });
        }
        originalFeaturedIds = featuredGames.map((g) => g.folderSlug);
        loading = false;
    });

    // --- DnD ---
    function startDrag(e: DragEvent, id: string, from: "available" | "featured") {
        draggingId = id;
        dragFrom = from;
        e.dataTransfer?.setData("text/plain", id);
    }
    function allowDropList(e: DragEvent, list: "available" | "featured") {
        if (!draggingId || list === dragFrom) return;
        e.preventDefault();
    }
    function dropOnList(e: DragEvent, list: "available" | "featured") {
        e.preventDefault();
        if (!draggingId) return resetDrag();
        const game = allGames.find((g) => g.folderSlug === draggingId);
        if (game) {
            if (list === "featured") game.isFeatured = true;
            if (list === "available") game.isFeatured = false;
            allGames = [...allGames];
        }
        resetDrag();
    }
    function resetDrag() {
        draggingId = null;
        dragFrom = null;
    }

    // --- Actions ---
    function toggleFeatured(game: InstallableGameExtended) {
        game.isFeatured = !game.isFeatured;
        allGames = [...allGames];
    }

    async function save() {
        if (!isDirty) return;
        saving = true;
        error = "";
        message = "";
        try {
            addedFolderSlugs = addedGames.map((g) => g.folderSlug) ?? [];
            removedFolderSlugs = removedGames.map((g) => g.folderSlug) ?? [];
            await getServerApi().updateFeaturedGames({
                updateFeaturedGamesDto: {
                    addedSlugs: addedFolderSlugs,
                    removedSlugs: removedFolderSlugs,
                },
            });
            // --- RESET UI STATE APRÈS SUCCÈS ---
            originalFeaturedIds = featuredGames.map((g) => g.folderSlug); // annule dirty
            addedFolderSlugs = [];
            removedFolderSlugs = [];
            message = "Enregistré";
            toast.success("Modifications enregistrées avec succès");

            await GamesStore.getAvailableGames();
        } catch (e) {
            error = "Erreur lors de l'enregistrement";
            console.error(e);
            toast.error("Erreur lors de l'enregistrement");
        } finally {
            saving = false;
        }
    }
</script>

{#if loading}
    <div class="flex items-center justify-center h-screen">
        <div class="text-center space-y-4">
            <Loader class="size-8 animate-spin mx-auto text-primary" />
            <p class="text-muted-foreground">Chargement des jeux...</p>
        </div>
    </div>
{:else}
    <main class="flex h-dvh flex-col space-y-2 p-4 pb-5 overflow-hidden">
        <!-- Header Section -->
        <div class="space-y-2 shrink-0">
            <div class="flex items-center gap-3">
                <div class="rounded-lg bg-linear-to-br from-primary/20 to-primary/10 p-2">
                    <Star class="size-6 text-primary" />
                </div>
                <BlurFade delay={0.2} class="text-3xl font-bold">Jeux en vedette</BlurFade>
            </div>
            <p class="text-sm text-muted-foreground">Gérez les jeux affichés en vedette</p>
        </div>

        <!-- Stats Section -->
        <div class="grid grid-cols-2 gap-6 shrink-0">
            <Card.Root>
                <Card.Content class="pt-6">
                    <div class="space-y-2">
                        <p class="text-sm font-medium text-muted-foreground">Jeux disponibles</p>
                        <p class="text-2xl font-bold">{availableGames.length}</p>
                    </div>
                </Card.Content>
            </Card.Root>
            <Card.Root>
                <Card.Content class="pt-6">
                    <div class="space-y-2">
                        <p class="text-sm font-medium text-muted-foreground">Jeux en vedette</p>
                        <p class="text-2xl font-bold">{featuredGames.length}</p>
                    </div>
                </Card.Content>
            </Card.Root>
        </div>

        <!-- Toolbar Section -->
        {#if isDirty}
            <Card.Root class="border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 shrink-0">
                <Card.Content class="pt-4">
                    <div class="space-y-3">
                        <div class="space-y-2">
                            <p class="text-sm font-semibold text-amber-800 dark:text-amber-200">Modifications non enregistrées</p>
                            {#if addedGames.length > 0}
                                <p class="text-xs text-green-700 dark:text-green-400">
                                    + {addedGames.length} jeu{addedGames.length > 1 ? "x" : ""} ajouté{addedGames.length > 1 ? "s" : ""} :
                                    {#each addedGames.slice(0, 3) as g, i}
                                        {g.title}{#if i < Math.min(addedGames.length, 3) - 1},&nbsp;{/if}
                                    {/each}{#if addedGames.length > 3}…{/if}
                                </p>
                            {/if}
                            {#if removedGames.length > 0}
                                <p class="text-xs text-red-700 dark:text-red-400">
                                    - {removedGames.length} jeu{removedGames.length > 1 ? "x" : ""} retiré{removedGames.length > 1 ? "s" : ""} :
                                    {#each removedGames.slice(0, 3) as g, i}
                                        {g.title}{#if i < Math.min(removedGames.length, 3) - 1},&nbsp;{/if}
                                    {/each}{#if removedGames.length > 3}…{/if}
                                </p>
                            {/if}
                        </div>
                        <Button onclick={save} disabled={saving} class="w-full" size="sm">
                            {#if saving}
                                <Loader size={16} class="mr-2 animate-spin" />
                                Enregistrement...
                            {:else}
                                Enregistrer les modifications
                            {/if}
                        </Button>
                    </div>
                </Card.Content>
            </Card.Root>
        {:else if message}
            <Card.Root class="border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/20 shrink-0">
                <Card.Content class="pt-4">
                    <p class="text-sm font-semibold text-green-800 dark:text-green-200">✓ {message}</p>
                </Card.Content>
            </Card.Root>
        {/if}
        <!-- Lists Section -->
        <div class="grid grid-cols-2 gap-6 flex-1 min-h-0 overflow-hidden max-h-[calc(100dvh-340px)]">
            <!-- Available Games -->
            <Card.Root class="flex flex-col min-h-0 overflow-hidden">
                <Card.Header class="border-b shrink-0">
                    <Card.Title class="text-lg">Tous les jeux</Card.Title>
                </Card.Header>
                <Card.Content class="flex-1 flex flex-col p-3 min-h-0 overflow-hidden">
                    <div class="mb-3 shrink-0">
                        <Input
                            placeholder="Chercher un jeu..."
                            bind:value={availableSearch}
                            class="h-9" />
                    </div>
                    <ul
                        class="flex-1 overflow-y-auto space-y-2 pr-2 min-h-0"
                        ondragover={(e) => allowDropList(e, "available")}
                        ondrop={(e) => dropOnList(e, "available")}>
                        {#each availableGamesFiltered as g}
                            <li
                                class="flex items-center justify-between gap-2 p-3 bg-muted/30 hover:bg-muted/50 rounded-lg border border-border transition-colors cursor-grab active:cursor-grabbing"
                                class:retire={isRemoved(g)}
                                data-id={g.folderSlug}
                                draggable="true"
                                ondragstart={(e) => startDrag(e, g.folderSlug!, "available")}
                                ondragend={resetDrag}
                                ondblclick={() => toggleFeatured(g)}
                                title="Glisser pour mettre en vedette; double-clic pour activer">
                                <span class="text-sm font-medium truncate">{g.title}</span>
                                <button
                                    type="button"
                                    class="px-2 py-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded transition-colors shrink-0"
                                    onclick={() => toggleFeatured(g)}>
                                    ➡
                                </button>
                            </li>
                        {/each}
                        {#if availableGames.length === 0}
                            <li class="text-center text-sm text-muted-foreground py-8">Tous les jeux sont en vedette</li>
                        {:else if availableGamesFiltered.length === 0}
                            <li class="text-center text-sm text-muted-foreground py-8">Aucun résultat</li>
                        {/if}
                    </ul>
                </Card.Content>
            </Card.Root>

            <!-- Featured Games -->
            <Card.Root class="flex flex-col min-h-0 overflow-hidden">
                <Card.Header class="border-b shrink-0">
                    <Card.Title class="text-lg">Jeux en vedette</Card.Title>
                </Card.Header>
                <Card.Content class="flex-1 flex flex-col p-3 min-h-0 overflow-hidden">
                    <div class="mb-3 shrink-0">
                        <Input
                            placeholder="Chercher un jeu..."
                            bind:value={featuredSearch}
                            class="h-9" />
                    </div>
                    <ul
                        class="flex-1 overflow-y-auto space-y-2 pr-2 min-h-0"
                        ondragover={(e) => allowDropList(e, "featured")}
                        ondrop={(e) => dropOnList(e, "featured")}>
                        {#each featuredGamesFiltered as g (g.folderSlug)}
                            <li
                                class="flex items-center justify-between gap-2 p-3 bg-muted/30 hover:bg-muted/50 rounded-lg border border-border transition-colors cursor-grab active:cursor-grabbing"
                                class:ajoute={isAdded(g)}
                                data-id={g.folderSlug}
                                draggable="true"
                                ondragstart={(e) => startDrag(e, g.folderSlug!, "featured")}
                                ondragend={resetDrag}
                                ondblclick={() => toggleFeatured(g)}
                                title="Glisser pour retirer; double-clic pour retirer">
                                <span class="text-sm font-medium truncate flex-1">{g.title}</span>
                                <button
                                    type="button"
                                    class="px-2 py-1 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded transition-colors shrink-0"
                                    onclick={() => toggleFeatured(g)}>
                                    ✕
                                </button>
                            </li>
                        {/each}
                        {#if featuredGames.length === 0}
                            <li class="text-center text-sm text-muted-foreground py-8">Aucun jeu en vedette</li>
                        {:else if featuredGamesFiltered.length === 0}
                            <li class="text-center text-sm text-muted-foreground py-8">Aucun résultat</li>
                        {/if}
                    </ul>
                    <p class="text-xs text-muted-foreground mt-4 pt-2 border-t shrink-0">💡 Glissez entre les listes ou cliquez sur les boutons pour modifier</p>
                </Card.Content>
            </Card.Root>
        </div>
    </main>
{/if}

<style>
    li.ajoute {
        outline: 1px solid hsl(var(--success));
        background: hsl(var(--success) / 0.12);
    }
    li.retire {
        outline: 1px dashed hsl(var(--danger));
        background: hsl(var(--danger) / 0.08);
        opacity: 0.85;
    }
</style>

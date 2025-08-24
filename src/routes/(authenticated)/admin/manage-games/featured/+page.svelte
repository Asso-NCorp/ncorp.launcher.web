<script lang="ts">
    import { GamesStore } from "$src/lib/states/games.svelte";
    import type { InstallableGameExtended } from "$src/lib/types";
    import { onMount } from "svelte";
    import Input from "$lib/components/ui/input/input.svelte";
    import Button from "$lib/components/ui/button/button.svelte";
    import { getServerApi } from "$src/lib/utils";
    import { toast } from "svelte-sonner";

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
    <p>Chargement...</p>
{:else if error}
    <p class="error">{error}</p>
{:else}
    <div class="toolbar">
        <Button onclick={save} disabled={!isDirty || saving} size="sm">
            {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
        {#if message}<span class="msg">{message}</span>{/if}
        {#if isDirty}<span class="dirty-indicator">Modifications non enregistrées</span>{/if}

        <!-- Optionnel: affichage brut des listes préparées -->
        {#if addedFolderSlugs.length || removedFolderSlugs.length}
            <code class="diff-inline">
                {#if addedFolderSlugs.length}+[{addedFolderSlugs.join(", ")}]{/if}
                {#if removedFolderSlugs.length}
                    -[{removedFolderSlugs.join(", ")}]
                {/if}
            </code>
        {/if}

        <!-- Résumé des changements -->
        {#if isDirty}
            <div class="diff-summary">
                {#if addedGames.length}
                    <span class="added">
                        + {addedGames.length} ajouté{addedGames.length > 1 ? "s" : ""} :
                        {#each addedGames.slice(0, 5) as g, i}
                            {g.title}{#if i < Math.min(addedGames.length, 5) - 1},&nbsp;{/if}
                        {/each}{#if addedGames.length > 5}…{/if}
                    </span>
                {/if}
                {#if removedGames.length}
                    <span class="removed">
                        - {removedGames.length} retiré{removedGames.length > 1 ? "s" : ""} :
                        {#each removedGames.slice(0, 5) as g, i}
                            {g.title}{#if i < Math.min(removedGames.length, 5) - 1},
                            {/if}
                        {/each}{#if removedGames.length > 5}…{/if}
                    </span>
                {/if}
            </div>
        {/if}
    </div>
    <div class="lists">
        <section class="list" aria-label="Tous les jeux">
            <h3>Tous les jeux</h3>
            <div class="search">
                <Input
                    placeholder="Chercher..."
                    aria-label="Chercher dans tous les jeux"
                    bind:value={availableSearch}
                    class="h-8 px-2 text-xs" />
                {#if availableSearch}
                    <Button
                        variant="ghost"
                        size="sm"
                        class="clear-btn h-6 px-2"
                        aria-label="Effacer la recherche"
                        onclick={() => (availableSearch = "")}>
                        ✕
                    </Button>
                {/if}
            </div>
            <ul ondragover={(e) => allowDropList(e, "available")} ondrop={(e) => dropOnList(e, "available")}>
                {#each availableGamesFiltered as g}
                    <li
                        class:retire={isRemoved(g)}
                        data-id={g.folderSlug}
                        draggable="true"
                        ondragstart={(e) => startDrag(e, g.folderSlug!, "available")}
                        ondragend={resetDrag}
                        ondblclick={() => toggleFeatured(g)}
                        title="Glisser pour mettre en vedette; double-clic pour activer">
                        <span>{g.title}</span>
                        <Button
                            variant="secondary"
                            size="sm"
                            aria-label="Mettre en vedette"
                            onclick={() => toggleFeatured(g)}>
                            ➡
                        </Button>
                    </li>
                {/each}
                {#if availableGames.length === 0}
                    <li class="empty">Tous les jeux sont en vedette</li>
                {:else if availableGamesFiltered.length === 0}
                    <li class="empty">Aucun résultat</li>
                {/if}
            </ul>
        </section>

        <section class="list" aria-label="Jeux en vedette">
            <h3>Jeux en vedette</h3>
            <div class="search">
                <Input
                    placeholder="Chercher..."
                    aria-label="Chercher dans les jeux en vedette"
                    bind:value={featuredSearch}
                    class="h-8 px-2 text-xs" />
                {#if featuredSearch}
                    <Button
                        variant="ghost"
                        size="sm"
                        class="clear-btn h-6 px-2"
                        aria-label="Effacer la recherche"
                        onclick={() => (featuredSearch = "")}>
                        ✕
                    </Button>
                {/if}
            </div>
            <ul ondragover={(e) => allowDropList(e, "featured")} ondrop={(e) => dropOnList(e, "featured")}>
                {#each featuredGamesFiltered as g (g.folderSlug)}
                    <li
                        class:ajoute={isAdded(g)}
                        data-id={g.folderSlug}
                        draggable="true"
                        ondragstart={(e) => startDrag(e, g.folderSlug!, "featured")}
                        ondragend={resetDrag}
                        ondblclick={() => toggleFeatured(g)}
                        title="Glisser pour retirer; double-clic pour retirer">
                        <span class="name">{g.title}</span>
                        <Button
                            variant="destructive"
                            size="sm"
                            aria-label="Retirer de la mise en vedette"
                            onclick={() => toggleFeatured(g)}>
                            ✕
                        </Button>
                    </li>
                {/each}
                {#if featuredGames.length === 0}
                    <li class="empty">Aucun jeu en vedette</li>
                {:else if featuredGamesFiltered.length === 0}
                    <li class="empty">Aucun résultat</li>
                {/if}
            </ul>
            <p class="hint">Glissez entre les listes ou cliquez pour basculer la mise en vedette.</p>
        </section>
    </div>
{/if}

<style>
    /* Reworked colors to use theme variables */
    .lists {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
    }
    .list {
        flex: 1;
        min-width: 0;
    }
    .list h3 {
        margin: 0 0 0.5rem;
        font-size: 1rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    ul {
        list-style: none;
        margin: 0;
        padding: 0.25rem;
        border: 1px solid hsl(var(--border));
        background: hsl(var(--card));
        border-radius: var(--radius); /* remplacé */
        min-height: 300px;
        max-height: 480px;
        overflow-y: auto;
    }
    li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0.4rem 0.55rem;
        border-radius: var(--radius); /* remplacé */
        cursor: grab;
        user-select: none;
        background: hsl(var(--background));
        margin: 2px 0;
        font-size: 0.9rem;
        transition:
            background 0.15s,
            color 0.15s,
            outline-color 0.15s;
    }
    li:hover {
        background: hsl(var(--secondary) / 0.8);
    }
    li:active {
        background: hsl(var(--secondary));
    }
    li.empty {
        cursor: default;
        background: none;
        outline: none;
        text-align: center;
        padding: 1rem 0.5rem;
        opacity: 0.6;
        border-radius: var(--radius); /* cohérence */
    }
    button {
        cursor: pointer;
        background: hsl(var(--secondary));
        border: 1px solid hsl(var(--border));
        color: hsl(var(--secondary-foreground));
        border-radius: 4px;
        font-size: 0.75rem;
        padding: 0.25rem 0.45rem;
    }
    button:hover:not(:disabled) {
        background: hsl(var(--accent));
        color: hsl(var(--accent-foreground));
        border-color: hsl(var(--accent));
    }
    button:active:not(:disabled) {
        background: hsl(var(--accent) / 0.85);
    }
    button:disabled {
        opacity: 0.5;
        cursor: default;
    }
    .name {
        flex: 1;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }
    .toolbar {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
    }
    .msg {
        color: hsl(var(--success));
        font-size: 0.85rem;
    }
    .error {
        color: hsl(var(--danger));
    }
    .dirty-indicator {
        color: hsl(var(--warning));
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .hint {
        font-size: 0.65rem;
        opacity: 0.6;
        margin-top: 0.4rem;
        color: hsl(var(--muted-foreground));
    }
    .search {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        margin: 0 0 0.5rem;
        background: hsl(var(--background-subtle));
        padding: 0.35rem 0.5rem;
        border: 1px solid hsl(var(--border));
        border-radius: var(--radius); /* remplacé */
    }
    .search input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        color: hsl(var(--foreground));
        font-size: 0.75rem;
    }
    .search input::placeholder {
        color: hsl(var(--muted-foreground));
    }
    .search .clear {
        background: hsl(var(--secondary));
        color: hsl(var(--secondary-foreground));
        border: 1px solid hsl(var(--border));
        padding: 0.15rem 0.4rem;
        line-height: 1;
        font-size: 0.65rem;
    }
    .search .clear:hover {
        background: hsl(var(--accent));
        color: hsl(var(--accent-foreground));
        border-color: hsl(var(--accent));
    }
    .toolbar {
        /* ...existing code... */
        flex-wrap: wrap;
    }
    .diff-summary {
        display: flex;
        gap: 0.75rem;
        font-size: 0.65rem;
        line-height: 1.2;
        flex-wrap: wrap;
        max-width: 100%;
    }
    .diff-summary .added {
        color: hsl(var(--success));
    }
    .diff-summary .removed {
        color: hsl(var(--danger));
    }
    li.ajoute {
        outline: 1px solid hsl(var(--success));
        background: hsl(var(--success) / 0.12);
    }
    li.retire {
        outline: 1px dashed hsl(var(--danger));
        background: hsl(var(--danger) / 0.08);
        opacity: 0.85;
    }
    .clear-btn {
        line-height: 1;
    }
    .diff-inline {
        font-size: 0.55rem;
        opacity: 0.75;
        background: hsl(var(--background-subtle));
        padding: 0.25rem 0.4rem;
        border: 1px solid hsl(var(--border));
        border-radius: var(--radius);
        max-width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>

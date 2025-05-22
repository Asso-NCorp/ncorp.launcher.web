<script lang="ts">
    import { Search } from "@lucide/svelte";
    import { Field, Control, Label, FieldErrors, Description } from "formsnap";
    import { t } from "$src/lib/translations";
    import { Input } from "$lib/components/ui/input";
    import * as Form from "$lib/components/ui/form";
    import { getServerApi } from "$lib/utils";
    import type { Game } from "$lib/shared-models";
    import { onMount } from "svelte";
    import { toast } from "svelte-sonner";

    // Props
    let {
        title = $bindable(),
        form,
        onGameSelect,
    } = $props<{
        title?: string;
        form: any; // Form reference for validation
        onGameSelect: (game: Game) => void;
    }>();

    // State
    let searchResults = $state<Game[]>([]);
    let isSearching = $state(false);
    let searchOpen = $state(false);
    let inputElement = $state<HTMLDivElement | undefined>(undefined);
    let searchContainer = $state<HTMLDivElement | undefined>(undefined);
    let searchTimeout = $state<ReturnType<typeof setTimeout> | null>(null);

    // Handle clicks outside the search dropdown to close it
    onMount(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchOpen && searchContainer && !searchContainer.contains(event.target as Node)) {
                searchOpen = false;
            }
        };

        document.addEventListener("click", handleClickOutside);

        return () => {
            document.removeEventListener("click", handleClickOutside);
            // Clear any pending timeout when component is destroyed
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
        };
    });

    async function searchGames(query: string) {
        if (!query || query.length < 2) {
            searchResults = [];
            return;
        }

        isSearching = true;
        try {
            const serverApi = getServerApi();
            const results = await serverApi.searchGame({ gameSlug: query });
            searchResults = results;
            if (results.length > 0 && !searchOpen) {
                searchOpen = true;
            }
        } catch (error) {
            console.error("Error searching games:", error);
            toast.error("Erreur lors de la recherche de jeux");
        } finally {
            isSearching = false;
        }
    }

    function handleSearchInput(event: Event) {
        const target = event.target as HTMLInputElement;
        const query = target.value;
        title = query;

        // Clear any existing timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // Set a new timeout to debounce the search
        searchTimeout = setTimeout(() => {
            searchGames(query);
        }, 300); // 300ms debounce delay
    }

    function formatReleaseDate(date: Date | null | undefined): string {
        if (!date) return "";
        return new Date(date).getFullYear().toString();
    }

    function getImageUrl(key: string): string {
        if (key.startsWith("/")) {
            return key;
        } else if (key.startsWith("http")) {
            return key;
        } else if (key.startsWith("data:")) {
            return key;
        } else {
            return `https://images.igdb.com/igdb/image/upload/t_720p/${key}.jpg`;
        }
    }

    function handleGameSelection(game: Game) {
        onGameSelect(game);
        searchOpen = false;

        // Focus back on the input after selection
        setTimeout(() => {
            const input = inputElement?.querySelector("input");
            if (input) {
                (input as HTMLInputElement).focus();
            }
        }, 0);
    }
</script>

<Field {form} name="title">
    <Control>
        {#snippet children({ props })}
            <Label for="title">{$t("title")}</Label>
            <div class="relative" bind:this={searchContainer}>
                <div class="relative">
                    <div bind:this={inputElement}>
                        <Input
                            placeholder="{$t('search_game')}..."
                            autocomplete="off"
                            {...props}
                            bind:value={title}
                            id="title"
                            type="text"
                            oninput={handleSearchInput}
                            class="pr-10" />
                    </div>
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                        <Search class="size-4 opacity-50" />
                    </div>
                </div>

                {#if searchOpen}
                    <div class="absolute z-50 mt-1 w-full rounded-md border bg-popover p-0 shadow-md">
                        <div class="max-h-[300px] overflow-auto p-1">
                            {#if isSearching}
                                <div class="flex items-center justify-center p-4 text-sm">Recherche en cours...</div>
                            {:else if searchResults.length === 0}
                                <div class="p-4 text-sm text-muted-foreground">
                                    {$t("no_element_found")}
                                </div>
                            {:else}
                                <div class="grid gap-1">
                                    {#each searchResults as game}
                                        <button
                                            class="flex w-full items-center gap-3 rounded-sm p-2 text-left hover:bg-accent"
                                            onclick={() => handleGameSelection(game)}>
                                            <div class="h-20 flex-shrink-0 overflow-hidden rounded">
                                                <img
                                                    src={getImageUrl(game.cover?.value?.imageId || "")}
                                                    alt={game.name || ""}
                                                    class="h-full w-full object-cover" />
                                            </div>
                                            <div class="flex flex-col">
                                                <div class="font-medium">{game.name}</div>
                                                {#if game.firstReleaseDate}
                                                    <div class="text-xs text-muted-foreground">
                                                        {formatReleaseDate(game.firstReleaseDate)}
                                                    </div>
                                                {/if}
                                            </div>
                                        </button>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    </div>
                {/if}
            </div>
        {/snippet}
    </Control>
    <FieldErrors />
</Field>

<script lang="ts">
    import { X, ChevronsUpDown } from "@lucide/svelte";
    import { t } from "$src/lib/translations";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import { Button } from "$lib/components/ui/button";
    import { Label } from "$lib/components/ui/label";
    import * as Form from "$lib/components/ui/form";

    // Props
    const {
        genres = [],
        onChange,
        form,
    } = $props<{
        genres?: string[];
        onChange: (genres: string[]) => void;
        form: any; // Form reference for validation
    }>();

    // Common game genres
    const commonGenres = [
        "Action",
        "Adventure",
        "RPG",
        "Strategy",
        "Simulation",
        "Sports",
        "Racing",
        "Puzzle",
        "Shooter",
        "Fighting",
        "Platformer",
        "Stealth",
        "Survival",
        "Horror",
        "MMORPG",
        "MOBA",
        "Battle Royale",
        "Card Game",
        "Educational",
        "Casual",
        "Indie",
    ];

    // Add a genre
    function addGenre(genre: string) {
        if (!genres.includes(genre)) {
            onChange([...genres, genre]);
        }
    }

    // Remove a genre
    function removeGenre(genre: string) {
        onChange(genres.filter((g: string) => g !== genre));
    }

    // Toggle a genre
    function toggleGenre(genre: string, checked: boolean) {
        if (checked) {
            addGenre(genre);
        } else {
            removeGenre(genre);
        }
    }
</script>

<Form.Field {form} name="genres">
    <Form.Control>
        {#snippet children()}
            <Label for="genres">{$t("genres")}</Label>
            <div class="relative">
                <div class="flex flex-wrap gap-2 rounded-md border p-2">
                    {#if genres && genres.length > 0}
                        {#each genres as genre}
                            <div class="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-sm">
                                <span>{genre}</span>
                                <button
                                    type="button"
                                    class="text-muted-foreground hover:text-foreground"
                                    onclick={() => removeGenre(genre)}>
                                    <X class="size-3" />
                                </button>
                            </div>
                        {/each}
                    {:else}
                        <div class="text-sm text-muted-foreground">{$t("no_genres_selected")}</div>
                    {/if}
                </div>

                <DropdownMenu.Root>
                    <DropdownMenu.Trigger class="mt-2 w-full">
                        <Button variant="outline" class="w-full justify-between">
                            {$t("select_genres")}
                            <ChevronsUpDown class="size-4 opacity-50" />
                        </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content class="w-56">
                        <DropdownMenu.Label>{$t("select_genres")}</DropdownMenu.Label>
                        <DropdownMenu.Separator />
                        <div class="max-h-[300px] overflow-y-auto">
                            {#each commonGenres as genre}
                                <DropdownMenu.CheckboxItem
                                    checked={genres ? genres.includes(genre) : false}
                                    onCheckedChange={(checked) => toggleGenre(genre, checked)}>
                                    {genre}
                                </DropdownMenu.CheckboxItem>
                            {/each}
                        </div>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            </div>
        {/snippet}
    </Form.Control>
    <Form.FieldErrors />
</Form.Field>

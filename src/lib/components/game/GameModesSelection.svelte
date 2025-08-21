<script lang="ts">
    import { X, ChevronsUpDown } from "@lucide/svelte";
    import { t } from "$src/lib/translations";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import { Button } from "$lib/components/ui/button";
    import { Label } from "$lib/components/ui/label";
    import * as Form from "$lib/components/ui/form";

    // Props
    export let gameModes: string[] = [];
    export let onChange: (gameModes: string[]) => void;
    export let form: any;

    // Allowed game modes with value/label
    type GameModeOption = { value: string; label: string };

    const allowedGameModes: GameModeOption[] = [
        { value: "SOLO", label: "SOLO (1👤)" },
        { value: "COOP", label: "COOP (2-6👥)" },
        { value: "MULTI", label: "MULTI (6+👥👥)" },
    ];

    function getGameModeLabel(value: string): string {
        return allowedGameModes.find((m) => m.value === value)?.label ?? value;
    }

    // Add a game mode
    function addGameMode(mode: string) {
        if (!gameModes.includes(mode)) {
            onChange([...gameModes, mode]);
        }
    }

    // Remove a game mode
    function removeGameMode(mode: string) {
        onChange(gameModes.filter((m: string) => m !== mode));
    }

    // Toggle a game mode
    function toggleGameMode(mode: string, checked: boolean) {
        if (checked) {
            addGameMode(mode);
        } else {
            removeGameMode(mode);
        }
    }
</script>

<Form.Field {form} name="gameModes">
    <Form.Control>
        {#snippet children()}
            <Label for="gameModes">{$t("game_modes")}</Label>
            <div class="relative">
                <div class="flex flex-wrap gap-2 rounded-md border p-2">
                    {#if gameModes && gameModes.length > 0}
                        {#each gameModes as mode}
                            <div class="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-sm">
                                <span>{getGameModeLabel(mode)}</span>
                                <button
                                    type="button"
                                    class="text-muted-foreground hover:text-foreground"
                                    onclick={() => removeGameMode(mode)}>
                                    <X class="size-3" />
                                </button>
                            </div>
                        {/each}
                    {:else}
                        <div class="text-sm text-muted-foreground">{$t("no_game_modes_selected")}</div>
                    {/if}
                </div>

                <DropdownMenu.Root>
                    <DropdownMenu.Trigger class="mt-2 w-full">
                        <Button variant="outline" class="w-full justify-between">
                            {$t("select_game_modes")}
                            <ChevronsUpDown class="size-4 opacity-50" />
                        </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content class="w-56">
                        <DropdownMenu.Label>{$t("select_game_modes")}</DropdownMenu.Label>
                        <DropdownMenu.Separator />
                        <div class="max-h-[300px] overflow-y-auto">
                            {#each allowedGameModes as opt}
                                <DropdownMenu.CheckboxItem
                                    checked={gameModes ? gameModes.includes(opt.value) : false}
                                    onCheckedChange={(checked) => toggleGameMode(opt.value, checked)}>
                                    {opt.label}
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

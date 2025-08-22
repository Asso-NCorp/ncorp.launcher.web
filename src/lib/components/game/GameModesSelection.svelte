<script lang="ts">
    import { X, ChevronsUpDown, User, Users, UsersRound } from "@lucide/svelte";
    import { t } from "$src/lib/translations";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import { Button } from "$lib/components/ui/button";
    import { Label } from "$lib/components/ui/label";
    import * as Form from "$lib/components/ui/form";

    // Props
    export let gameModes: string[] = [];
    export let onChange: (gameModes: string[]) => void;
    export let form: any;

    type IconComponent = typeof User;
    // Allowed game modes with value/label
    type GameModeOption = { value: string; text: string; icons: IconComponent[] };

    const allowedGameModes: GameModeOption[] = [
        { value: "SOLO", text: "SOLO (1)", icons: [User] },
        { value: "COOP", text: "COOP (2-6)", icons: [User, Users] },
        { value: "MULTI", text: "MULTI (6+)", icons: [Users, UsersRound] },
    ];

    function getGameModeOption(value: string) {
        return allowedGameModes.find((o) => o.value === value);
    }

    // Precompute entries to avoid invalid {#const} block
    $: gameModeEntries = gameModes.map((mode) => ({ mode, opt: getGameModeOption(mode) }));

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
                    {#if gameModeEntries && gameModeEntries.length > 0}
                        {#each gameModeEntries as { mode, opt }}
                            <div class="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-sm">
                                <span class="flex items-center gap-1">
                                    {opt?.text ?? mode}
                                    {#if opt}
                                        <span class="flex items-center gap-0.5">
                                            {#each opt.icons as I}
                                                <I class="h-3.5 w-3.5" />
                                            {/each}
                                        </span>
                                    {/if}
                                </span>
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
                                    class="mode-item"
                                    checked={gameModes ? gameModes.includes(opt.value) : false}
                                    onCheckedChange={(checked) => toggleGameMode(opt.value, checked)}>
                                    <span class="flex items-center gap-2">
                                        <span class="flex items-center gap-1">
                                            {opt.text}
                                            <span class="flex items-center gap-0.5">
                                                {#each opt.icons as I}
                                                    <I class="h-4 w-4 opacity-80" />
                                                {/each}
                                            </span>
                                        </span>
                                    </span>
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

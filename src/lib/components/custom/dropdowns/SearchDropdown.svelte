<script lang="ts">
    import * as Popover from "$lib/components/ui/popover/index.js";
    import * as Command from "$lib/components/ui/command/index.js";
    import { Button } from "$lib/components/ui/button";
    import { Check, ChevronsUpDown } from "@lucide/svelte";
    import { tick } from "svelte";
    import { cn } from "$lib/utils";
    import { t } from "$src/lib/translations";
    import { Label } from "../../ui/label";

    // Définir les props avec $props
    let {
        options,
        value = $bindable(), // Supporte la liaison bidirectionnelle
        displayField = "name", // Champ par défaut pour l'affichage
        placeholder = $t("select_folder"),
        searchPlaceholder = $t("search_folder"),
        icon = null, // Icône optionnelle
    } = $props<{
        options: Array<string | { [key: string]: any }>; // Chaînes ou objets
        value?: string | { [key: string]: any };
        displayField?: string;
        placeholder?: string;
        searchPlaceholder?: string;
        icon?: any; // Composant Svelte pour l'icône
    }>();

    // État interne
    let open = $state(false);
    let triggerRef = $state<HTMLButtonElement>(null!);

    // Récupérer la valeur à afficher pour une option
    function getDisplayValue(option: string | { [key: string]: any }) {
        if (typeof option === "string") return option;
        return option[displayField];
    }

    // Vérifier si une option est sélectionnée
    function isSelected(option: string | { [key: string]: any }) {
        if (typeof value === "string" && typeof option === "string") {
            return value === option;
        }
        if (typeof value === "object" && typeof option === "object") {
            return value[displayField] === option[displayField];
        }
        return false;
    }

    // Fermer et refocaliser après sélection
    function closeAndFocusTrigger() {
        open = false;
        tick().then(() => triggerRef.focus());
    }
</script>

<Popover.Root bind:open>
    <Popover.Trigger bind:ref={triggerRef}>
        <Button variant="outline" class="flex w-96" role="combobox" aria-expanded={open}>
            <div class="flex w-full flex-1 items-center justify-between">
                {#if value}
                    {getDisplayValue(value)}
                {:else}
                    {placeholder}
                {/if}
                <ChevronsUpDown class="size-4 opacity-50" />
            </div>
        </Button>
    </Popover.Trigger>
    <Popover.Content class="w-96 p-0">
        <Command.Root>
            <Command.Input placeholder={searchPlaceholder} />
            <Command.List>
                <Command.Empty>{$t("no_element_found")}</Command.Empty>
                <Command.Group>
                    {#each options as option}
                        <Command.Item
                            value={getDisplayValue(option)}
                            onSelect={() => {
                                value = option; // Met à jour la valeur bindée
                                closeAndFocusTrigger();
                            }}>
                            <Check class={cn(!isSelected(option) && "text-transparent")} />
                            <div class="flex items-center gap-2">
                                {#if icon}
                                    <svelte:component this={icon} class="text-info" />
                                {/if}
                                <div>{getDisplayValue(option)}</div>
                            </div>
                        </Command.Item>
                    {/each}
                </Command.Group>
            </Command.List>
        </Command.Root>
    </Popover.Content>
</Popover.Root>

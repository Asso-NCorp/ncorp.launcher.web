<script lang="ts">
    import * as Popover from "$lib/components/ui/popover/index.js";
    import * as Command from "$lib/components/ui/command/index.js";
    import { Button } from "$lib/components/ui/button";
    import { Check, ChevronsUpDown } from "@lucide/svelte";

    import { cn } from "$lib/utils";
    import { t } from "$src/lib/translations";
    import { Label } from "../../ui/label";

    // Define props
    const {
        options,
        value = "",
        displayField = "name",
        placeholder = $t("select_folder"),
        searchPlaceholder = $t("search_folder"),
        icon = null,
        onSelect = undefined,
    } = $props<{
        options: Array<string | { [key: string]: any }>;
        value?: string | { [key: string]: any };
        displayField?: string;
        placeholder?: string;
        searchPlaceholder?: string;
        icon?: any;
        onSelect?: (value: string) => void;
    }>();

    // Internal state
    let open = $state(false);
    let triggerRef: HTMLButtonElement | null = null;
    let searchValue = $state("");
    let currentValue = $state(value);

    // Update currentValue when value prop changes
    $effect(() => {
        currentValue = value;
    });

    // Computed values
    const displayValue = $derived(() => {
        if (!currentValue) return "";
        if (typeof currentValue === "string") return currentValue;
        return currentValue[displayField] || "";
    });

    // Filtrer les options en fonction de la recherche
    const filteredOptions = $derived(() => {
        if (!searchValue) return options;

        return options.filter((option: string | { [key: string]: any }) => {
            const optionValue = typeof option === "string" ? option : option[displayField];
            return optionValue.toLowerCase().includes(searchValue.toLowerCase());
        });
    });

    // Select an option
    function selectOption(option: string | { [key: string]: any }) {
        currentValue = option;
        open = false;

        // Call the onSelect callback if provided
        if (onSelect) {
            if (typeof option === "string") {
                onSelect(option);
            } else {
                onSelect(option[displayField] || "");
            }
        }
    }

    // Check if an option is selected
    function isSelected(option: string | { [key: string]: any }) {
        if (!currentValue) return false;
        if (typeof option === "string" && typeof currentValue === "string") {
            return option === currentValue;
        }
        if (typeof option !== "string" && typeof currentValue !== "string") {
            return option[displayField] === currentValue[displayField];
        }
        return false;
    }

    // Get the display value of an option
    function getOptionDisplayValue(option: string | { [key: string]: any }) {
        return typeof option === "string" ? option : option[displayField] || "";
    }
</script>

<div class="grid gap-2">
    <Label>{placeholder}</Label>
    <Popover.Root bind:open>
        <Popover.Trigger>
            <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                class="w-full justify-between"
                bind:this={triggerRef}>
                {#if icon}
                    <svelte:component this={icon} class="mr-2 h-4 w-4" />
                {/if}
                {displayValue || placeholder}
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
        </Popover.Trigger>
        <Popover.Content class="w-full p-0" style="width: {triggerRef?.offsetWidth}px">
            <Command.Root>
                <Command.Input placeholder={searchPlaceholder} bind:value={searchValue} class="h-9" />
                <Command.Empty>{$t("no_element_found")}</Command.Empty>
                <Command.Group class="max-h-[200px] overflow-auto">
                    {#each filteredOptions as option (typeof option === "string" ? option : option[displayField])}
                        <Command.Item
                            value={getOptionDisplayValue(option)}
                            onSelect={() => selectOption(option)}
                            class={cn("flex items-center gap-2", isSelected(option) ? "bg-accent" : "")}>
                            {getOptionDisplayValue(option)}
                            {#if isSelected(option)}
                                <Check class="ml-auto h-4 w-4" />
                            {/if}
                        </Command.Item>
                    {/each}
                </Command.Group>
            </Command.Root>
        </Popover.Content>
    </Popover.Root>
</div>

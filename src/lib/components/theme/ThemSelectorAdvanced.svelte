<!-- src/lib/components/ThemeSelectorAdvanced.svelte -->
<script lang="ts">
    import { currentThemeId, setTheme } from "$lib/stores/themeStore";
    import { themes } from "$lib/themes/themes";
    import { cn } from "$lib/utils";
    import { tick } from "svelte";

    // Import shadcn-svelte components
    import * as Popover from "$lib/components/ui/popover";
    import { Button } from "$lib/components/ui/button";
    import { Check, ChevronDown } from "@lucide/svelte";

    let { class: klazz }: { class?: string } = $props();

    // Reference for scrolling to the selected theme
    let themesContainerRef: HTMLDivElement;
    let open = $state(false);

    // Event handler for popover open state changes
    async function handleOpenChange(isOpen: boolean) {
        // Track the actual open state from the popover
        open = isOpen;

        if (isOpen) {
            // Wait for the popover content to render
            await tick();
            // Scroll to the selected theme (center it), using a valid behavior value
            const selectedTheme = themesContainerRef?.querySelector("[data-active='true']");
            if (selectedTheme instanceof HTMLElement) {
                selectedTheme.scrollIntoView({ behavior: "auto", block: "center" });
            }
        }
    }

    function selectTheme(themeId: string) {
        setTheme(themeId);
    }

    let currentThemeName = $derived(themes[$currentThemeId as keyof typeof themes]?.name || "Thème inconnu");
</script>

<div class={cn("w-[calc(var(--userlist-width)-1rem)]  relative shrink-0 border-l hover:bg-subtle px-4", klazz)}>
    <Popover.Root onOpenChange={(e) => handleOpenChange(e)}>
        <Popover.Trigger class="h-full w-full ">
            <div class="flex h-full items-center justify-center border-0 px-2 text-center">
                <div class="flex h-full w-full flex-col items-center justify-between">
                    <div class="flex w-full justify-between">
                        <span class="text-xss uppercase">Thème</span>
                        <span class="flex items-center gap-1">
                            <span class="size-2 rounded-full border" style="background-color: hsl(var(--background))">
                            </span>
                            <span class="size-2 rounded-full" style="background-color: hsl(var(--accent))"></span>
                        </span>
                    </div>
                    <div class="flex w-full items-center justify-center gap-2">
                        <span class="truncate text-ellipsis whitespace-nowrap">{currentThemeName}</span>
                        <ChevronDown class="h-4 w-4 transition-transform duration-200" />
                    </div>
                </div>
            </div>
        </Popover.Trigger>

        <Popover.Content class="w-72  p-4" align="end" sideOffset={4}>
            <div class="flex flex-col">
                <h3 class="mb-2 text-lg font-medium">Choisir un thème</h3>

                <div class="grid max-h-[80vh] grid-cols-1 gap-3 overflow-y-auto py-2" bind:this={themesContainerRef}>
                    {#each Object.entries(themes) as [id, theme]}
                        <button
                            type="button"
                            style={`background-color: hsl(${theme.cssVars.background})`}
                            data-active={$currentThemeId === id}
                            class="relative flex flex-col items-start rounded-md border p-3 transition-colors hover:bg-muted"
                            class:ring-2={$currentThemeId === id}
                            class:ring-primary={$currentThemeId === id}
                            onclick={() => selectTheme(id)}>
                            <span class="mb-2 font-medium">{theme.name}</span>

                            {#if $currentThemeId === id}
                                <span
                                    class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                    <Check class="h-4 w-4" />
                                </span>
                            {/if}

                            <div class="flex w-full items-center justify-between">
                                <div class="flex gap-1">
                                    <span
                                        class="h-5 w-5 rounded-full"
                                        style={`background-color: hsl(${theme.cssVars.primary})`}>
                                    </span>
                                    <span
                                        class="h-5 w-5 rounded-full"
                                        style={`
                                        background-color: hsl(${theme.cssVars.background});
                                        border: 1px solid hsl(${theme.cssVars.border})`}>
                                    </span>
                                    <span
                                        class="h-5 w-5 rounded-full"
                                        style={`background-color: hsl(${theme.cssVars.accent})`}>
                                    </span>
                                </div>

                                <!-- Preview area -->
                                <div class="flex items-center gap-1">
                                    <div
                                        class="flex h-8 w-8 items-center justify-center rounded"
                                        style={`background-color: hsl(${theme.cssVars.primary}); color: hsl(${theme.cssVars["primary-foreground"]})`}>
                                        A
                                    </div>
                                    <div
                                        class="flex h-8 w-8 items-center justify-center rounded"
                                        style={`background-color: hsl(${theme.cssVars.secondary}); color: hsl(${theme.cssVars["secondary-foreground"]})`}>
                                        B
                                    </div>
                                    <div
                                        class="flex h-8 w-8 items-center justify-center rounded"
                                        style={`background-color: hsl(${theme.cssVars.accent}); color: hsl(${theme.cssVars["accent-foreground"]})`}>
                                        C
                                    </div>
                                </div>
                            </div>
                        </button>
                    {/each}
                </div>
            </div>
        </Popover.Content>
    </Popover.Root>
</div>

<script lang="ts">
    import { Upload, ImagePlus } from "@lucide/svelte";
    import { t } from "$src/lib/translations";
    import { TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs";
    import { Tabs } from "$lib/components/ui/tabs";
    import * as Card from "$lib/components/ui/card";
    import SelectableImage from "$lib/components/custom/SelectableImage.svelte";

    // Props
    const { screenshots = {}, onChange } = $props<{
        screenshots?: { [key: string]: string };
        onChange: (screenshots: { [key: string]: string }) => void;
    }>();

    // State for all screenshots (both selected and unselected)
    let allScreenshots = $state<{ key: string; value: string; selected: boolean }[]>([]);

    // Track if initial load has happened
    let initialLoadComplete = $state(false);

    // Track the previous screenshots object to detect when it's cleared
    let previousScreenshotsCount = $state(0);

    // Effect to update allScreenshots when screenshots prop changes
    $effect(() => {
        const currentCount = Object.keys(screenshots).length;

        // Check if screenshots were cleared (form was submitted successfully)
        if (previousScreenshotsCount > 0 && currentCount === 0) {
            // Reset the component state
            allScreenshots = [];
            initialLoadComplete = false;
            previousScreenshotsCount = 0;
            return;
        }

        // Only process incoming screenshots if we haven't loaded yet
        // or if we have more screenshots than before (new ones were added externally)
        if (!initialLoadComplete || currentCount > allScreenshots.length) {
            // Get existing keys to avoid duplicates
            const existingKeys = new Set(allScreenshots.map((s) => s.key));

            // Process new screenshots
            const newScreenshots = Object.entries(screenshots)
                .filter(([key]) => !existingKeys.has(key))
                .map(([key, value]) => ({
                    key,
                    value: value as string,
                    selected: true,
                }));

            // Add new screenshots to existing ones
            if (newScreenshots.length > 0) {
                allScreenshots = [...allScreenshots, ...newScreenshots];
            }

            // Mark initial load as complete
            initialLoadComplete = true;
        }

        // Update the previous count
        previousScreenshotsCount = currentCount;
    });

    // Update selected screenshots when selection changes
    function updateSelectedScreenshots() {
        // Create a dictionary with only selected screenshots
        const selectedScreenshotsDict: { [key: string]: string } = {};

        // Add only selected screenshots to the dictionary
        allScreenshots.forEach((screenshot) => {
            if (screenshot.selected) {
                selectedScreenshotsDict[screenshot.key] = screenshot.value;
            }
        });

        // Update parent component with only selected screenshots
        onChange(selectedScreenshotsDict);
    }

    // Toggle screenshot selection
    function toggleScreenshot(index: number, selected: boolean) {
        // Update the selected state of the screenshot
        allScreenshots[index].selected = selected;

        // Update the parent component with only the selected screenshots
        updateSelectedScreenshots();
    }

    // Helper to generate a unique filename
    function generateFileName(extension = "jpg") {
        const timestamp = new Date().getTime();
        const random = Math.floor(Math.random() * 10000);
        return `screenshot_${timestamp}_${random}.${extension}`;
    }
</script>

<Card.Root>
    <Card.Header>
        <Card.Title class="flex items-center gap-2">
            <ImagePlus class="size-5" />
            {$t("screenshots")}
        </Card.Title>
        <Card.Description>
            {$t("select_or_upload_screenshots")}
        </Card.Description>
    </Card.Header>
    <Card.Content>
        <Tabs value="upload" class="w-full">
            <TabsList class="grid w-full grid-cols-2">
                <TabsTrigger value="upload">{$t("upload")}</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" class="pt-4">
                <div class="flex flex-col gap-4">
                    <div
                        class="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-4 hover:bg-muted/50"
                        onclick={() => document.getElementById("screenshots-upload")?.click()}>
                        <Upload class="size-8 text-muted-foreground" />
                        <p class="text-sm text-muted-foreground">{$t("drag_drop_or_click_multiple")}</p>
                    </div>
                    <input
                        type="file"
                        id="screenshots-upload"
                        accept="image/*"
                        multiple
                        class="hidden"
                        onchange={(e) => {
                            const files = (e.target as HTMLInputElement).files;
                            if (files && files.length > 0) {
                                for (let i = 0; i < files.length; i++) {
                                    const file = files[i];
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                        // Get the base64 data from the result
                                        const base64Data = event.target?.result as string;

                                        // Determine file extension from the original file
                                        let extension = "jpg";
                                        if (file.name && file.name.includes(".")) {
                                            extension = file.name.split(".").pop() || "jpg";
                                        }

                                        // Generate a unique filename
                                        const fileName = generateFileName(extension);

                                        // Add to allScreenshots array
                                        allScreenshots = [
                                            ...allScreenshots,
                                            {
                                                key: fileName,
                                                value: base64Data,
                                                selected: true,
                                            },
                                        ];

                                        // Update parent component with all screenshots
                                        updateSelectedScreenshots();
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }
                        }} />

                    {#if allScreenshots.length > 0}
                        <div class="mt-4">
                            <div class="mb-2 flex items-center justify-between">
                                <h4 class="text-sm font-medium">
                                    {$t("screenshots")}
                                    <span class="text-xs text-muted-foreground">(click to select/unselect)</span>
                                </h4>
                                <span class="text-xs text-muted-foreground">
                                    {allScreenshots.filter((s) => s.selected).length} of {allScreenshots.length} selected
                                </span>
                            </div>
                            <div class="grid grid-cols-3 gap-2">
                                {#each allScreenshots as screenshot, index}
                                    <SelectableImage
                                        src={screenshot.value}
                                        alt={`Screenshot ${index + 1}`}
                                        selected={screenshot.selected}
                                        onSelectChanged={(selected) => toggleScreenshot(index, selected)} />
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            </TabsContent>
        </Tabs>
    </Card.Content>
</Card.Root>

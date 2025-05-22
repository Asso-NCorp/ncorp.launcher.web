<script lang="ts">
    import { X, Upload } from "@lucide/svelte";
    import { t } from "$src/lib/translations";
    import { TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs";
    import { Tabs } from "$lib/components/ui/tabs";
    import * as Card from "$lib/components/ui/card";
    import { Image } from "@lucide/svelte";

    // Props
    const { cover = undefined, onChange } = $props<{
        cover?: { [key: string]: string };
        onChange: (cover: { [key: string]: string } | undefined) => void;
    }>();

    // Helper to get the image URL from the cover object
    function getCoverImageUrl() {
        if (!cover) return undefined;
        // Get the first value from the cover object
        const keys = Object.keys(cover);
        if (keys.length === 0) return undefined;
        return cover[keys[0]];
    }

    // Helper to generate a unique filename
    function generateFileName(extension = "jpg") {
        const timestamp = new Date().getTime();
        const random = Math.floor(Math.random() * 10000);
        return `cover_${timestamp}_${random}.${extension}`;
    }
</script>

<Card.Root>
    <Card.Header>
        <Card.Title class="flex items-center gap-2">
            <Image class="size-5" />
            {$t("cover_image")}
        </Card.Title>
        <Card.Description>
            {$t("select_or_upload_cover")}
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
                        class="flex h-64 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-4 hover:bg-muted/50"
                        onclick={() => document.getElementById("cover-upload")?.click()}>
                        {#if getCoverImageUrl()}
                            <div class="relative h-full w-full">
                                <img src={getCoverImageUrl()} alt="Cover" class="h-full w-full object-contain" />
                                <button
                                    type="button"
                                    class="absolute right-2 top-2 rounded-full bg-white/80 p-1 text-foreground hover:bg-white"
                                    onclick={(e) => {
                                        e.stopPropagation();
                                        onChange(undefined);
                                    }}>
                                    <X class="size-4" />
                                </button>
                            </div>
                        {:else}
                            <Upload class="size-8 text-muted-foreground" />
                            <p class="text-sm text-muted-foreground">{$t("drag_drop_or_click")}</p>
                        {/if}
                    </div>
                    <input
                        type="file"
                        id="cover-upload"
                        accept="image/*"
                        class="hidden"
                        onchange={(e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
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

                                    // Create the cover object with the filename as key and base64 as value
                                    onChange({ [fileName]: base64Data });
                                };
                                reader.readAsDataURL(file);
                            }
                        }} />
                </div>
            </TabsContent>
        </Tabs>
    </Card.Content>
</Card.Root>

<script lang="ts">
    import { X, Upload, Image } from "@lucide/svelte";
    import { t } from "$src/lib/translations";
    import * as Card from "$lib/components/ui/card";

    // Props (added heightClass, title, description)
    const {
        cover = undefined,
        onChange,
        heightClass = "h-64", // Tailwind height utility (e.g. h-40, h-[300px])
        title,
        description,
    } = $props<{
        cover?: { [key: string]: string };
        onChange: (cover: { [key: string]: string } | undefined) => void;
        heightClass?: string;
        title?: string;
        description?: string;
    }>();

    let isDragging = false; // drag visual state

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

    function handleFile(file: File) {
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
</script>

<Card.Root>
    <Card.Header>
        <Card.Title class="flex items-center gap-2">
            <Image class="size-5" />
            {title ?? $t("cover_image")}
        </Card.Title>
        <Card.Description>
            {description ?? $t("select_or_upload_cover")}
        </Card.Description>
    </Card.Header>
    <Card.Content class="pt-2">
        <div class="flex gap-2">
            <!-- Dropzone (left) -->
            <div
                class={`flex flex-1 ${heightClass} cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-4 text-center transition-colors hover:bg-muted/50 ${isDragging ? "bg-muted/70" : ""}`}
                role="button"
                tabindex="0"
                aria-label="Upload image"
                on:click={() => document.getElementById("cover-upload")?.click()}
                on:keydown={(e) =>
                    (e.key === "Enter" || e.key === " ") && document.getElementById("cover-upload")?.click()}
                on:dragenter|preventDefault={() => (isDragging = true)}
                on:dragover|preventDefault={() => (isDragging = true)}
                on:dragleave={() => (isDragging = false)}
                on:drop|preventDefault={(e) => {
                    isDragging = false;
                    const file = e.dataTransfer?.files?.[0];
                    if (file) handleFile(file);
                }}>
                <Upload class="size-8 text-muted-foreground" />
                <p class="text-xs text-muted-foreground">
                    {$t("drag_drop_or_click")}
                </p>
            </div>

            <!-- Preview (right) -->
            <div
                class={`relative flex w-1/3 items-center justify-center overflow-hidden rounded-md border ${heightClass} bg-muted/30`}>
                {#if getCoverImageUrl()}
                    <img src={getCoverImageUrl()} alt="Cover preview" class="h-full w-full object-contain" />
                    <button
                        type="button"
                        class="absolute right-2 top-2 rounded-full border border-border bg-background/80 p-1 text-foreground shadow transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        on:click={() => onChange(undefined)}
                        aria-label="Remove image">
                        <X class="size-4" />
                    </button>
                {:else}
                    <p class="px-4 text-center text-sm text-muted-foreground">
                        {$t("no_image_selected")}
                    </p>
                {/if}
            </div>
        </div>

        <input
            id="cover-upload"
            type="file"
            accept="image/*"
            class="hidden"
            on:change={(e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleFile(file);
            }} />
    </Card.Content>
</Card.Root>
